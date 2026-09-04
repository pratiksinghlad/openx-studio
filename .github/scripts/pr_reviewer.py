#!/usr/bin/env python3
"""
Automated PR Reviewer using Google Antigravity & AgentSkills.
Analyzes GitHub Pull Request diffs against project standards and posts feedback.
"""

import os
import sys
import asyncio
import subprocess
from pathlib import Path

# Configuration Constants
DEFAULT_MODEL = "gemini-2.5-flash"
MAX_DIFF_CHARS = 45_000
BOT_COMMENT_HEADER = "### 🤖 Antigravity Automated PR Review\n\n"
EXCLUDED_PATTERNS = (
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".min.js",
    ".min.css",
    ".map",
)

PRINCIPLE_FILE_PATHS = (
    "AgentSkills/agents/reviewer.agent.md",
    "AgentSkills/skills/standards/SKILL.md",
    "AgentSkills/skills/security/SKILL.md",
)


def load_principles(repo_root: Path) -> str:
    """Reads review guidelines and architecture principles from AgentSkills files."""
    collected_sections = []
    for relative_path in PRINCIPLE_FILE_PATHS:
        file_path = repo_root / relative_path
        if file_path.is_file():
            content = file_path.read_text(encoding="utf-8").strip()
            collected_sections.append(
                f"### Reference: `{relative_path}`\n\n{content}\n"
            )
    return "\n".join(collected_sections)


def get_pr_diff(pr_number: str) -> str:
    """Fetches the unified git diff of the PR using the GitHub CLI."""
    result = subprocess.run(
        ["gh", "pr", "diff", str(pr_number)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        print(f"Error fetching PR diff: {result.stderr}", file=sys.stderr)
        return ""
    return result.stdout


def filter_diff(raw_diff: str) -> str:
    """Filters out lockfiles and huge generated files from the diff."""
    chunks = raw_diff.split("diff --git ")
    kept_chunks = []
    for chunk in chunks:
        if not chunk.strip():
            continue
        header = chunk.splitlines()[0] if chunk.splitlines() else ""
        if any(excluded in header for excluded in EXCLUDED_PATTERNS):
            continue
        kept_chunks.append("diff --git " + chunk)

    filtered_text = "".join(kept_chunks)
    if len(filtered_text) > MAX_DIFF_CHARS:
        return (
            filtered_text[:MAX_DIFF_CHARS]
            + "\n\n...[Diff truncated for size limit]..."
        )
    return filtered_text


def build_system_prompt(principles_text: str) -> str:
    """Builds the system instructions injecting project principles."""
    return f"""You are the automated Pull Request reviewer for this repository.
Your task is to conduct an actionable, professional code review on the provided Pull Request diff.

## Repository Principles & Architectural Standards
You must review the code strictly against the project's standards defined below:

{principles_text}

## Review Guidelines
1. **Tone & Style**: Professional, constructive, and direct.
2. **Review Checklist**:
   - Scope & Minimality (YAGNI, no dead/debug code).
   - Complexity & Function length (<= 50 lines, max 2 nesting levels, <= 4 params).
   - Clean Code & Naming (SOLID, DRY, KISS, no magic numbers/strings).
   - Security (no hardcoded secrets, injection risks, sanitization).
   - Concurrency (race conditions, async handling).
3. **Format**:
   - **Verdict**: (APPROVE / REQUEST_CHANGES / COMMENT)
   - **Summary**: Concise overview of changes.
   - **Key Findings**: File path + line reference + explanation.
   - **Suggested Fixes**: Provide exact replacement code diffs where applicable.
"""


async def run_review_with_antigravity(
    model: str, api_key: str, system_prompt: str, pr_diff: str
) -> str:
    """Executes the code review using the google-antigravity SDK or fallback."""
    user_prompt = f"Please review the following Pull Request diff:\n\n```diff\n{pr_diff}\n```"

    try:
        from google.antigravity import Agent, LocalAgentConfig

        config = LocalAgentConfig(
            model=model,
            api_key=api_key,
            system_instructions=system_prompt,
        )
        tokens = []
        async with Agent(config) as agent:
            response = await agent.chat(user_prompt)
            async for token in response:
                tokens.append(token)
        return "".join(tokens)
    except Exception as exc:
        print(f"Antigravity SDK execution note ({exc}); trying standard client...", file=sys.stderr)
        return await run_review_fallback(model, api_key, system_prompt, user_prompt)


async def run_review_fallback(
    model: str, api_key: str, system_prompt: str, user_prompt: str
) -> str:
    """Fallback using google-genai SDK if antigravity native binary is omitted."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = await client.aio.models.generate_content(
        model=model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.2,
        ),
    )
    return response.text or "No review generated."


def post_pr_comment(pr_number: str, review_text: str) -> bool:
    """Submits the review as a comment on the GitHub PR."""
    full_comment = BOT_COMMENT_HEADER + review_text
    result = subprocess.run(
        ["gh", "pr", "comment", str(pr_number), "--body-file", "-"],
        input=full_comment,
        text=True,
        check=False,
    )
    return result.returncode == 0


async def main() -> None:
    """Main entrypoint orchestrating PR retrieval, analysis, and posting."""
    api_key = os.environ.get("ANTIGRAVITY_API_KEY") or os.environ.get("GEMINI_API_KEY")
    pr_number = os.environ.get("PR_NUMBER")
    model = os.environ.get("REVIEW_MODEL", DEFAULT_MODEL)

    if not api_key:
        print("Missing ANTIGRAVITY_API_KEY or GEMINI_API_KEY.", file=sys.stderr)
        sys.exit(1)

    if not pr_number:
        print("Missing PR_NUMBER environment variable.", file=sys.stderr)
        sys.exit(1)

    repo_root = Path(__file__).resolve().parent.parent.parent
    principles = load_principles(repo_root)
    raw_diff = get_pr_diff(pr_number)

    if not raw_diff.strip():
        print(f"PR #{pr_number} has an empty diff. Exiting.")
        sys.exit(0)

    filtered_diff = filter_diff(raw_diff)
    system_prompt = build_system_prompt(principles)

    print(f"Analyzing PR #{pr_number} using model '{model}'...")
    review = await run_review_with_antigravity(model, api_key, system_prompt, filtered_diff)

    print(f"Posting review to PR #{pr_number}...")
    if post_pr_comment(pr_number, review):
        print("Successfully posted PR review comment.")
    else:
        print("Failed to post PR comment.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
