/**
 * Pure non-DOM XML structure validator and root tag extractor.
 *
 * Replaces DOMParser to eliminate DOM-based XSS (CodeQL js/xss-through-dom)
 * and XXE injection vectors without instantiating browser DOM nodes.
 */

export interface XmlValidationResult {
  isValid: boolean;
  rootTag: string | null;
  errorMessage?: string;
}

export interface ScenarioValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

const TAG_REGEX = /<(\/)?([a-zA-Z_][a-zA-Z0-9_.:-]*)((?:\s+[^>]*)?)(\/?)>/g;
const DANGEROUS_DOCTYPE_REGEX = /<!DOCTYPE[^>]*\[[\s\S]*<!ENTITY[^>]+(?:SYSTEM|PUBLIC)[^>]*>[\s\S]*\]>/i;

/**
 * Strips XML comments, CDATA blocks, declarations, and processing instructions.
 */
function sanitizeXmlContent(rawXml: string): { cleanXml: string; hasDangerousEntity: boolean } {
  if (DANGEROUS_DOCTYPE_REGEX.test(rawXml)) {
    return { cleanXml: '', hasDangerousEntity: true };
  }

  const cleanXml = rawXml
    // Remove DOCTYPE blocks
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    // Remove CDATA blocks safely
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '')
    // Remove XML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove XML processing instructions & declaration
    .replace(/<\?[\s\S]*?\?>/g, '')
    .trim();

  return { cleanXml, hasDangerousEntity: false };
}

/**
 * Validates XML well-formedness and extracts the root element tag name safely.
 */
export function validateXmlStructure(rawContent: string): XmlValidationResult {
  if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
    return {
      isValid: false,
      rootTag: null,
      errorMessage: 'File is empty or not a valid text document.',
    };
  }

  const { cleanXml, hasDangerousEntity } = sanitizeXmlContent(rawContent);

  if (hasDangerousEntity) {
    return {
      isValid: false,
      rootTag: null,
      errorMessage: 'XML file contains disallowed external entity references (XXE).',
    };
  }

  if (!cleanXml.startsWith('<')) {
    return {
      isValid: false,
      rootTag: null,
      errorMessage: 'Missing valid XML root element.',
    };
  }

  return parseAndValidateXmlTokens(cleanXml);
}

/**
 * Tokenizes XML string and validates nesting integrity using a tag stack.
 */
function parseAndValidateXmlTokens(xml: string): XmlValidationResult {
  const tagStack: string[] = [];
  let rootTag: string | null = null;
  let match: RegExpExecArray | null;

  TAG_REGEX.lastIndex = 0;

  while ((match = TAG_REGEX.exec(xml)) !== null) {
    const isClosing = Boolean(match[1]);
    const tagName = match[2];
    const isSelfClosing = Boolean(match[4]) || match[3].endsWith('/');

    if (!isClosing) {
      if (!rootTag) {
        rootTag = tagName;
      }
      if (!isSelfClosing) {
        tagStack.push(tagName);
      }
    } else {
      if (tagStack.length === 0) {
        return {
          isValid: false,
          rootTag: null,
          errorMessage: `Unexpected closing tag </${tagName}> without matching opening tag.`,
        };
      }
      const expected = tagStack.pop();
      if (expected !== tagName) {
        return {
          isValid: false,
          rootTag: null,
          errorMessage: `Mismatched closing tag: expected </${expected}>, found </${tagName}>.`,
        };
      }
    }
  }

  if (!rootTag) {
    return {
      isValid: false,
      rootTag: null,
      errorMessage: 'No XML root element found in document.',
    };
  }

  if (tagStack.length > 0) {
    return {
      isValid: false,
      rootTag: null,
      errorMessage: `Unclosed XML tag <${tagStack[tagStack.length - 1]}>.`,
    };
  }

  return { isValid: true, rootTag };
}

/**
 * Validates scenario files (.xosc and .xodr) according to ASAM standards.
 */
export function validateScenarioFile(filename: string, content: string): ScenarioValidationResult {
  const name = filename.toLowerCase();
  const xmlResult = validateXmlStructure(content);

  if (!xmlResult.isValid || !xmlResult.rootTag) {
    return {
      isValid: false,
      errorMessage: `Invalid XML structure in "${filename}". ${xmlResult.errorMessage || 'Please ensure the file is a well-formed XML document.'}`,
    };
  }

  if (name.endsWith('.xosc')) {
    if (xmlResult.rootTag !== 'OpenSCENARIO') {
      return {
        isValid: false,
        errorMessage: `File "${filename}" has .xosc extension but is missing the expected <OpenSCENARIO> root element.`,
      };
    }
  } else if (name.endsWith('.xodr')) {
    if (xmlResult.rootTag !== 'OpenDRIVE') {
      return {
        isValid: false,
        errorMessage: `File "${filename}" has .xodr extension but is missing the expected <OpenDRIVE> root element.`,
      };
    }
  }

  return { isValid: true };
}
