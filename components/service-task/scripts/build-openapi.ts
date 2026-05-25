import { buildOpenApiDocument } from '@psykl/shared-types';

const doc = buildOpenApiDocument();
process.stdout.write(JSON.stringify(doc, null, 2));
