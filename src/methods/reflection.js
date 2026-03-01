export const reflection = {
  id: 'reflection',
  name: 'Reflection',
  category: 'Reflection Symmetry',
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
  ],
  getTransforms(config, tileW, tileH) {
    const axis = config.axis ?? 'vertical';

    const original = { transform: '' };

    // Vertical axis reflection: flip horizontally across tile center
    const verticalMirror = {
      transform: `translate(${tileW}, 0) scale(-1, 1)`,
    };

    // Horizontal axis reflection: flip vertically across tile center
    const horizontalMirror = {
      transform: `translate(0, ${tileH}) scale(1, -1)`,
    };

    if (axis === 'vertical') {
      return [original, verticalMirror];
    } else if (axis === 'horizontal') {
      return [original, horizontalMirror];
    } else {
      // Both: original + vertical mirror + horizontal mirror + 180° rotation (both axes)
      return [
        original,
        verticalMirror,
        horizontalMirror,
        {
          transform: `translate(${tileW}, ${tileH}) scale(-1, -1)`,
        },
      ];
    }
  },
};
