Terrain texture sources

The following 1k physically based, photographed surface maps are from Poly Haven.
All maps are distributed under Creative Commons CC0 1.0 Universal:
https://polyhaven.com/license
https://creativecommons.org/publicdomain/zero/1.0/

Aerial Sand (albedo, OpenGL normal):
https://polyhaven.com/a/aerial_sand
Snow Field Aerial (albedo, OpenGL normal):
https://polyhaven.com/a/snow_field_aerial
Aerial Rocks 02 (albedo, OpenGL normal):
https://polyhaven.com/a/aerial_rocks_02
Forest Sand 01 (albedo, OpenGL normal):
https://polyhaven.com/a/forrest_sand_01
Asphalt 02 (albedo, OpenGL normal):
https://polyhaven.com/a/asphalt_02

Downloaded as local JPEGs from https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/.
No texture is loaded from an external server at runtime.

High resolution photographed maps

Native quality uses original 2048 x 2048 albedo and OpenGL normal JPEGs.
Ultra quality uses original 4096 x 4096 albedo JPEGs with 2048 x 2048 normals.
Auto quality uses the existing 1k maps. Failed high-resolution requests fall
back to the local 1k versions. Files suffixed -2k / -4k retain their original
source pixels; no files were enlarged. All eighteen added maps were checked
for their actual dimensions and valid JPEG data.

Additional photographed grass source (albedo and OpenGL normal):
https://polyhaven.com/a/aerial_grass_rock

Original high-resolution source pattern:
https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/ASSET/ASSET_diff_2k.jpg
https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/ASSET/ASSET_nor_gl_2k.jpg
https://dl.polyhaven.org/file/ph-assets/Textures/jpg/4k/ASSET/ASSET_diff_4k.jpg
Snow Field Aerial uses 'col' in place of 'diff'.

All maps remain local runtime assets under the same CC0 license listed above.

Measured elevation (accessed 2026-10-23):
Mapzen Terrain Tiles: https://registry.opendata.aws/terrain-tiles/
Elevation samples from the Great Smoky Mountains, Cascades, Red Rock Canyon, Maine coast, Greenland and Sierra Nevada are resampled to 65x65 grids in elevation-data.js. Heights are normalized, horizontally adapted, and blended with fictional mission clearings. This is a fictional landscape, not a geographic navigation product.
United States 3DEP, GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey.
ArcticDEM DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736.
Global ETOPO1 terrain data: DOC/NOAA/NESDIS/NCEI, National Centers for Environmental Information, NESDIS, NOAA, U.S. Department of Commerce.
Provider attribution and license details: https://github.com/tilezen/joerd/blob/master/docs/attribution.md

REVISION 29 / EXPANDED RESCUE CAMPAIGN
Additional measured terrain samples: Reykjanes Peninsula (Iceland), Kauai coast (Hawaii), and Bonneville Basin (Utah), obtained from the same Mapzen Terrain Tiles source on 2026-10-23. Samples are normalized and adapted to the fictional geothermal, tropical island and salt-flat environments. Shorelines, mission clearings and streamed outer terrain are authored for play. Photographed 4K surface maps retain their original pixels; 2K normals supply local relief. Salt fracture detail and mineral distribution are procedural.
