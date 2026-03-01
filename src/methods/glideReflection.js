export const glideReflection = {
  id: 'glideReflection',
  name: 'Glide Reflection',
  category: 'Glide Reflection Symmetry',
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
      label: 'Glide Distance',
      type: 'range',
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
  getTransforms(config, tileW, tileH) {
    const axis = config.axis ?? 'horizontal';
    const glideDistance = config.glideDistance ?? 0.5;

    const original = { transform: '' };

    if (axis === 'horizontal') {
      // Reflect across horizontal center, then translate along x
      const tx = glideDistance * tileW;
      return [
        original,
        {
          transform: `translate(${tx}, ${tileH}) scale(1, -1)`,
        },
      ];
    } else {
      // Reflect across vertical center, then translate along y
      const ty = glideDistance * tileH;
      return [
        original,
        {
          transform: `translate(${tileW}, ${ty}) scale(-1, 1)`,
        },
      ];
    }
  },
};
