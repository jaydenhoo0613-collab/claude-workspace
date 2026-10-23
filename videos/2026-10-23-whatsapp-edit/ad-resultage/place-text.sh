#!/bin/bash
# This take frames the face low (mouth ~1080 px, chin ~1200 px), so text moves onto the chest.
# Run after engine.mjs, before rendering. Appended last so it wins over ad.css.
sed -i 's#</style></head>#.dev{top:1250px}.cap{top:1300px}\n</style></head>#' index.html
grep -c "\.dev{top:1250px}" index.html
