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
    },
    {
      key: 'distance',
      label: 'Distance',
      type: 'range',
      default: 0,
      min: -5,
      max: 5,
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
};
