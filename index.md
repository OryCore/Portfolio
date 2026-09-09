---
title: Sparse voxel radiance caching
date: 2026-04-18
summary: Caching irradiance in a sparse voxel tree, and why the naive version is slower than no cache at all.
tags: [rendering, webgl, geometry]
cover: cover.webp
coverAlt: A voxelised interior lit by a single area light
status: published
links:
  repo: https://github.com/username/voxel-cache
  paper: https://example.com/paper.pdf
---

The first version of this cache made the renderer slower. That result is the
interesting part, so this note starts there and works backwards.

## The measurement

Frame time went from 8.1 ms to 11.4 ms after adding the cache. The lookup
itself was cheap; the cost was entirely in cache _misses_ forcing a scattered
read pattern across the tree.

| Configuration | Frame time | Cache hits |
| ------------- | ---------: | ---------: |
| No cache      |     8.1 ms |          — |
| Naive octree  |    11.4 ms |        42% |
| Brick pool    |     5.9 ms |        91% |

## The maths

Irradiance at a point is the cosine-weighted integral over the hemisphere:

$$
E(\mathbf{x}) = \int_{\Omega} L_i(\mathbf{x}, \omega) \, (\mathbf{n} \cdot \omega) \, d\omega
$$

For a diffuse surface with albedo $\rho$, outgoing radiance is
$L_o = \frac{\rho}{\pi} E$, which is what makes caching viable at all: one
scalar per voxel rather than a full directional distribution.

The discrete estimator over $N$ samples:

$$
\hat{E} = \frac{1}{N} \sum_{i=1}^{N} \frac{L_i(\omega_i)(\mathbf{n} \cdot \omega_i)}{p(\omega_i)}
$$

## The fix

Storing bricks contiguously turned the scattered reads into sequential ones.

```js {6-9} title=cache.js
const BRICK = 4; // 4³ voxels per brick

export function lookup(pool, node, local) {
  if (node.brick < 0) return null;

  const base = node.brick * BRICK ** 3;
  const x = Math.min((local.x * BRICK) | 0, BRICK - 1);
  const y = Math.min((local.y * BRICK) | 0, BRICK - 1);
  const z = Math.min((local.z * BRICK) | 0, BRICK - 1);

  return pool[base + (z * BRICK + y) * BRICK + x];
}
```

The same idea in the compute path:

```python
def brick_index(node, local, size=4):
    """Flatten a local voxel coordinate into the brick pool."""
    if node.brick < 0:
        return None
    base = node.brick * size ** 3
    x, y, z = (min(int(c * size), size - 1) for c in local)
    return base + (z * size + y) * size + x
```

:::note type=finding
The win was not the cache. It was the memory layout the cache forced us to
think about.
:::

## Results

:::gallery
media-1.webp
media-2.webp
media-3.webp
:::

A capture of the convergence behaviour, at one sample per pixel:

:::video src=video-1.webm poster=media-2.webp caption="Convergence over 240 frames"
:::

Further reading: the brick-pool layout follows Crassin's sparse voxel octree
work[^crassin], with the irradiance term simplified as above.

[^crassin]: Crassin et al., _Interactive Indirect Illumination Using Voxel Cone Tracing_, 2011.
