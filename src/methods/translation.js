export const translation = {
  id: 'translation',
  name: 'Translation',
  category: 'Basic Symmetry Operations',
  description: 'Repeats the motif offset by a distance',
  configSchema: [
    {
      key: 'dx',
      label: 'Horizontal Offset',
      type: 'range',
      default: 0.5,
      min: -5,
      max: 5,
      step: 0.01,
    },
    {
      key: 'dy',
      label: 'Vertical Offset',
      type: 'range',
      default: 0,
      min: -5,
      max: 5,
      step: 0.01,
    },
    {
      key: 'copies',
      label: 'Copies',
      type: 'range',
      default: 1,
      min: 1,
      max: 6,
      step: 1,
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
    const dx = config.dx ?? 0.5;
    const dy = config.dy ?? 0;
    const copies = config.copies ?? 1;
    const elemRot = config.elementRotation ?? 0;
    const cx = tileW / 2;
    const cy = tileH / 2;

    const transforms = [{ transform: elemRot ? `rotate(${elemRot}, ${cx}, ${cy})` : '' }];
    for (let i = 1; i <= copies; i++) {
      const tx = i * dx * tileW;
      const ty = i * dy * tileH;
      transforms.push({
        transform: `translate(${tx}, ${ty})${elemRot ? ` rotate(${elemRot}, ${cx}, ${cy})` : ''}`,
      });
    }
    return transforms;
  },
  getGuideElements(config, tileW, tileH) {
    const dx = (config.dx ?? 0.5) * tileW;
    const dy = (config.dy ?? 0) * tileH;
    const cx = tileW / 2;
    const cy = tileH / 2;

    return [{
      type: 'arrow',
      x1: cx, y1: cy,
      x2: cx + dx, y2: cy + dy,
    }];
  },
};
