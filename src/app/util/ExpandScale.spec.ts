import {ExpandScale} from "./ExpandScale";

describe('Class: ExpandScale', () => {
  let scale: ExpandScale;

  beforeEach(() => {
    scale = new ExpandScale();
  });

  it('Test regular bandwidth', () => {
    scale = scale
      .setDomain(['0', '1', '2'])
      .setRange([0, 700])
      .padding(0.1);

    expect(Math.floor(scale.bandwidth())).toBe(217);

    expect(Math.floor(scale.scale('0'))).toBe(0);
    expect(Math.floor(scale.scale('1'))).toBe(241);
  });

  it('Test expanded bandwidth with two items', () => {
    scale = scale
      .setDomain(['0', '1'])
      .setRange([0, 700])
      .padding(0.1)
      .setExpandItem('1');

    expect(Math.floor(scale.bandwidth('0'))).toBe(217);
    expect(Math.floor(scale.bandwidth('1'))).toBe(458);

    expect(Math.floor(scale.scale('0'))).toBe(0);
    expect(Math.floor(scale.scale('1'))).toBe(241);
  });

  it('Test expanded bandwidth with five items', () => {
    scale = scale
      .setDomain(['0', '1', '2', '3', '4'])
      .setRange([0, 700])
      .padding(0.1)
      .setExpandItem('1');

    expect(Math.floor(scale.bandwidth('0'))).toBe(106);
    expect(Math.floor(scale.bandwidth('1'))).toBe(225);
    expect(Math.floor(scale.bandwidth('2'))).toBe(106);
    expect(Math.floor(scale.bandwidth('3'))).toBe(106);
    expect(Math.floor(scale.bandwidth('4'))).toBe(106);

    expect(Math.floor(scale.scale('0'))).toBe(0);
    expect(Math.floor(scale.scale('1'))).toBe(118);
    expect(Math.floor(scale.scale('2'))).toBe(355);
    expect(Math.floor(scale.scale('3'))).toBe(474);
    expect(Math.floor(scale.scale('4'))).toBe(593);
  });

});
