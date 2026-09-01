import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateXmlStructure,
  validateScenarioFile,
} from '../../src/lib/xmlValidator.ts';

describe('XML Validator & Scenario File Inspector', () => {
  it('validates a well-formed OpenSCENARIO XML string and identifies the root tag', () => {
    const validXosc = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FileHeader revMajor="1" revMinor="3" date="2026-05-20" description="Test" author="OpenX Studio"/>
  <Entities>
    <ScenarioObject name="Ego"/>
  </Entities>
</OpenSCENARIO>`;

    const res = validateXmlStructure(validXosc);
    assert.equal(res.isValid, true);
    assert.equal(res.rootTag, 'OpenSCENARIO');
    assert.equal(res.errorMessage, undefined);
  });

  it('validates a well-formed OpenDRIVE XML string and identifies the root tag', () => {
    const validXodr = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sample OpenDRIVE road network -->
<OpenDRIVE>
  <header name="Town01" revMajor="1" revMinor="4"/>
  <road id="1" length="100.0" junction="-1">
    <link/>
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="100.0">
        <line/>
      </geometry>
    </planView>
  </road>
</OpenDRIVE>`;

    const res = validateXmlStructure(validXodr);
    assert.equal(res.isValid, true);
    assert.equal(res.rootTag, 'OpenDRIVE');
  });

  it('handles self-closing root tags cleanly', () => {
    const selfClosing = `<OpenSCENARIO version="1.2" />`;
    const res = validateXmlStructure(selfClosing);
    assert.equal(res.isValid, true);
    assert.equal(res.rootTag, 'OpenSCENARIO');
  });

  it('ignores comments with pseudo-tags and CDATA contents', () => {
    const withCommentsAndCdata = `
<!-- <FakeRoot> This is a comment </FakeRoot> -->
<OpenSCENARIO>
  <Data><![CDATA[ <UnparsedTag attr="test">Hello</UnparsedTag> ]]></Data>
</OpenSCENARIO>`;

    const res = validateXmlStructure(withCommentsAndCdata);
    assert.equal(res.isValid, true);
    assert.equal(res.rootTag, 'OpenSCENARIO');
  });

  it('rejects malformed XML with mismatched closing tags', () => {
    const malformed = `<OpenSCENARIO><Entities><ScenarioObject></Entities></OpenSCENARIO>`;
    const res = validateXmlStructure(malformed);
    assert.equal(res.isValid, false);
    assert.match(res.errorMessage || '', /Mismatched closing tag/);
  });

  it('rejects unclosed XML tags', () => {
    const unclosed = `<OpenSCENARIO><Entities><ScenarioObject name="Ego"/></OpenSCENARIO>`;
    // Missing </Entities>
    const res = validateXmlStructure(unclosed);
    assert.equal(res.isValid, false);
    assert.match(res.errorMessage || '', /Mismatched closing tag|Unclosed XML tag/);
  });

  it('rejects empty or whitespace-only inputs', () => {
    const emptyRes = validateXmlStructure('');
    assert.equal(emptyRes.isValid, false);

    const wsRes = validateXmlStructure('   \n\t  ');
    assert.equal(wsRes.isValid, false);
  });

  it('rejects non-XML random text or binary data', () => {
    const textRes = validateXmlStructure('This is plain text without any XML tags.');
    assert.equal(textRes.isValid, false);
  });

  it('blocks dangerous DOCTYPE external entities (XXE defense)', () => {
    const xxePayload = `<?xml version="1.0"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<OpenSCENARIO>&xxe;</OpenSCENARIO>`;

    const res = validateXmlStructure(xxePayload);
    assert.equal(res.isValid, false);
    assert.match(res.errorMessage || '', /external entity references/i);
  });

  it('validates scenario files matching their extensions correctly', () => {
    const xoscContent = `<OpenSCENARIO><FileHeader description="valid"/></OpenSCENARIO>`;
    const xodrContent = `<OpenDRIVE><header name="valid"/></OpenDRIVE>`;

    const xoscValid = validateScenarioFile('highway.xosc', xoscContent);
    assert.equal(xoscValid.isValid, true);

    const xodrValid = validateScenarioFile('highway.xodr', xodrContent);
    assert.equal(xodrValid.isValid, true);
  });

  it('detects mismatched root element for file extensions', () => {
    const xoscWithXodrContent = `<OpenDRIVE><header name="wrong"/></OpenDRIVE>`;
    const xoscRes = validateScenarioFile('wrong.xosc', xoscWithXodrContent);
    assert.equal(xoscRes.isValid, false);
    assert.match(xoscRes.errorMessage || '', /missing the expected <OpenSCENARIO> root element/);

    const xodrWithXoscContent = `<OpenSCENARIO><FileHeader description="wrong"/></OpenSCENARIO>`;
    const xodrRes = validateScenarioFile('wrong.xodr', xodrWithXoscContent);
    assert.equal(xodrRes.isValid, false);
    assert.match(xodrRes.errorMessage || '', /missing the expected <OpenDRIVE> root element/);
  });
});
