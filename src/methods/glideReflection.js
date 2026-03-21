export const glideReflection = {
  id: 'glideReflection',
  name: 'Glide Reflection',
  category: 'Basic Symmetry Operations',
  description: 'Reflects the motif and translates it along the reflection axis',
  configSchema: [
    {
      key: 'axis',
      label: 'Axis',
      type: 'select',
      default: 'horizontal',
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
      ],
    },
    {
      key: 'glideDistance',
      label: 'Translation distance',
      type: 'range',
      default: 0.5,
      min: -5,
      max: 5,
      step: 0.01,
    },
    {
      key: 'reflectionDistance',
      label: 'Reflection distance',
      type: 'range',
      default: 1,
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
    const axis = config.axis ?? 'horizontal';
    const refDist = config.reflectionDistance ?? 1;
    const glideDist = config.glideDistance ?? 0.5;
    const elemRot = config.elementRotation ?? 0;

    const cx = tileW / 2;
    const cy = tileH / 2;
    const rot = elemRot ? ` rotate(${elemRot}, ${cx}, ${cy})` : '';

    if (axis === 'horizontal') {
      return [
        { transform: rot.trim() || '' },
        {
          transform: `translate(${glideDist * tileW}, ${refDist * tileH}) scale(1, -1)${rot}`,
        },
      ];
    } else {
      return [
        { transform: rot.trim() || '' },
        {
          transform: `translate(${refDist * tileW}, ${glideDist * tileH}) scale(-1, 1)${rot}`,
        },
      ];
    }
  },
};
