# Brand, artwork and sensory feedback

Accepted scope: refine the existing checkout, use suitable open assets, make hot food visibly warm, add quiet category-specific cart feedback, and prepare coherent brand/share/press material.

| ID     | Observable behavior                                                                                                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UX-06  | Warm products have decorative vapor outside the card; cold products do not. Reduced motion and the animation control stop this decoration.                                                                                                                   |
| UX-07  | A successful user-initiated cart addition has a quiet category-specific sound. No sound on load, blocked additions, removal, restored orders or rejected storage writes. A persistent mute control is always available. Audio failure never blocks the cart. |
| UX-08  | Coffee artwork varies in silhouette, vessel and contents. Open assets retain source, version and license records.                                                                                                                                            |
| UX-09  | The storefront, receipt, favicon and press assets share one visual identity, labeled as an independent Mashgin take-home concept by Megafuji.                                                                                                                |
| OPS-04 | Public page metadata, social cards, robots and sitemap use configured PUBLIC_ORIGIN without trusting the Host header. Local development is not advertised as a public canonical site.                                                                        |

## Implementation decisions

- Use Kenney Food Kit 2.0 (CC0) for selected foods. Render its original GLB models into static PNGs at build-tool time; Three.js is not shipped to customers.
- Keep original SVG packaging and add distinct coffee SVGs when the open pack does not represent the product accurately.
- Use bounded CSS vapor, no particle engine. Sound uses Web Audio with brief envelopes, a conservative gain and a rate limit, started only by an add gesture.
- Use Mashgin's current public charcoal, warm white and citrus direction as a reference. Create a separate concept wordmark and explain authorship; do not imply production affiliation or real computer vision.
- Provide editable SVG brand/press sources and PNG social exports, with download links and source credits. Do not publish or deploy to a new domain in this scope.
- Preserve order integrity, ownership, normal search and Jev fallback. No provider retry is needed for visual polish.
