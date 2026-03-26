export const reflection = {
  id: 'reflection',
  name: 'Reflection',
  category: 'Basic Symmetry Operations',
  description: 'Mirrors the motif across an axis',
  configSchema: [
    {
      key: 'axisAngle',
      label: 'Mirror Angle',
      type: 'range',
      default: 0,
      min: -90,
      max: 90,
      step: 1,
      unit: '°',
    },
    {
      key: 'distance',
      label: 'Distance',
      type: 'range',
      default: 0,
      min: -10,
      max: 10,
      step: 0.01,
    },
    {
      key: 'elementRotation',
      label: 'Element Rotation',
      type: 'range',
      default: 0,
      min: -180,
      max: 180,
      step: 1,
      unit: '°',
    },
  ],
  getTransforms(config, tileW, tileH) {
    const dist = config.distance ?? 0;
    const elemRot = config.elementRotation ?? 0;
    const axisAngle = config.axisAngle ?? 0;
    const cx = tileW / 2;
    const cy = tileH / 2;
    const rot = elemRot ? ` rotate(${elemRot}, ${cx}, ${cy})` : '';

    // Mirror perpendicular to offset direction:
    // angle=0: copy right (vertical mirror), 90: below (horizontal mirror), -90: above
    const aRad = -axisAngle * Math.PI / 180;
    const cos2a = Math.cos(2 * aRad);
    const sin2a = Math.sin(2 * aRad);

    // Offset in the direction of axisAngle
    const offX = dist * tileW * Math.cos(aRad);
    const offY = dist * tileH * Math.sin(aRad);

    // Reflection matrix: mirror axis perpendicular to offset direction
    const copyTransform = `translate(${offX}, ${offY}) translate(${cx}, ${cy}) matrix(${-cos2a}, ${-sin2a}, ${-sin2a}, ${cos2a}, 0, 0) translate(${-cx}, ${-cy})${rot}`;

    return [
      { transform: rot.trim() || '' },
      { transform: copyTransform },
    ];
  },
  getGuideElements(config, tileW, tileH) {
    const dist = config.distance ?? 0;
    const axisAngle = config.axisAngle ?? 0;
    const cx = tileW / 2;
    const cy = tileH / 2;
    const aRad = -axisAngle * Math.PI / 180;

    // Mirror line center is at midpoint of offset
    const mx = cx + (dist * tileW * Math.cos(aRad)) / 2;
    const my = cy + (dist * tileH * Math.sin(aRad)) / 2;

    // Mirror line direction is perpendicular to offset
    const perpAngle = aRad + Math.PI / 2;
    const len = Math.max(tileW, tileH) * 0.6;

    return [{
      type: 'mirrorLine',
      x1: mx - len / 2 * Math.cos(perpAngle),
      y1: my - len / 2 * Math.sin(perpAngle),
      x2: mx + len / 2 * Math.cos(perpAngle),
      y2: my + len / 2 * Math.sin(perpAngle),
    }];
  },
};
