export const rotation = {
  id: 'rotation',
  name: 'Rotation',
  category: 'Basic Symmetry Operations',
  description: 'Rotates the motif around a point with configurable order',
  configSchema: [
    {
      key: 'order',
      label: 'Copies',
      type: 'range',
      default: 2,
      min: 0,
      max: 36,
      step: 1,
      onChange: (value) => ({
        angle: value > 0 ? 360 / (value + 1) : 0,
      }),
    },
    {
      key: 'startAngle',
      label: 'Motif Rotation',
      type: 'range',
      default: 0,
      min: 0,
      max: 360,
      step: 1,
    },
    {
      key: 'angle',
      label: 'Copy Angle',
      type: 'range',
      default: 180,
      min: 0,
      max: 360,
      step: 1,
      snap: (cfg) => cfg.order > 0 ? 360 / (cfg.order + 1) : 0,
      disabled: (cfg) => (cfg.order ?? 2) === 0,
    },
    {
      key: 'distance',
      label: 'Distance',
      type: 'range',
      default: 1,
      min: 0,
      max: 10,
      step: 0.01,
      disabled: (cfg) => (cfg.order ?? 2) === 0,
    },
    {
      key: 'pointAngle',
      label: 'Pivot Direction',
      type: 'range',
      default: 0,
      min: 0,
      max: 359,
      step: 1,
      disabled: (cfg) => (cfg.order ?? 2) === 0,
    },
  ],
  getTransforms(config, tileW, tileH) {
    const order = config.order ?? 2;
    const angle = config.angle ?? 180;
    const startAngle = config.startAngle ?? 0;
    const distance = config.distance ?? 0;
    const pointAngle = config.pointAngle ?? 0;

    // Rotation point relative to tile
    const rad = (pointAngle * Math.PI) / 180;
    const cx = tileW / 2 + distance * (tileW / 2) * Math.cos(rad);
    const cy = tileH / 2 - distance * (tileH / 2) * Math.sin(rad);

    // Copies = 0: just the original, optionally rotated by startAngle
    if (order === 0) {
      if (startAngle === 0) return [{ transform: '' }];
      return [{
        transform: `translate(${cx}, ${cy}) rotate(${startAngle}) translate(${-cx}, ${-cy})`,
      }];
    }

    const transforms = [];
    for (let i = 0; i <= order; i++) {
      const a = startAngle + i * angle;
      if (a === 0) {
        transforms.push({ transform: '' });
      } else {
        transforms.push({
          transform: `translate(${cx}, ${cy}) rotate(${a}) translate(${-cx}, ${-cy})`,
        });
      }
    }
    return transforms;
  },
};
