export const reflection = {
  id: 'reflection',
  name: 'Reflection',
  category: 'Basic Symmetry Operations',
  description: 'Mirrors the motif across an axis',
  configSchema: [
    {
      key: 'axis',
      label: 'Axis',
      type: 'select',
      default: 'vertical',
      options: [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'both', label: 'Both' },
      ],
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
      label: 'Element rotation',
      type: 'range',
      default: 0,
      min: -180,
      max: 180,
      step: 1,
    },
  ],
  getTransforms(config, tileW, tileH) {
    const axis = config.axis ?? 'vertical';
    const dist = config.distance ?? 0;
    const elemRot = config.elementRotation ?? 0;

    const cx = tileW / 2;
    const cy = tileH / 2;
    const rot = elemRot ? ` rotate(${elemRot}, ${cx}, ${cy})` : '';

    const hOff = dist * tileW;
    const vOff = dist * tileH;

    if (axis === 'vertical') {
      return [
        { transform: rot.trim() || '' },
        { transform: `translate(${tileW + hOff}, 0) scale(-1, 1)${rot}` },
      ];
    } else if (axis === 'horizontal') {
      return [
        { transform: rot.trim() || '' },
        { transform: `translate(0, ${tileH + vOff}) scale(1, -1)${rot}` },
      ];
    } else {
      return [
        { transform: rot.trim() || '' },
        { transform: `translate(${tileW + hOff}, 0) scale(-1, 1)${rot}` },
        { transform: `translate(0, ${tileH + vOff}) scale(1, -1)${rot}` },
        { transform: `translate(${tileW + hOff}, ${tileH + vOff}) scale(-1, -1)${rot}` },
      ];
    }
  },
};
