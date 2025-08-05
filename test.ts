import { Muzzle } from "./dist";

const muzzle = new Muzzle({
    config: {
        debug: true,
        caching: {
            backend: {
                type: "file",
            },
        },
        logLevel: "debug",
        response: {
            includeMatches: true,
            includeMetadata: true,
            includeSeverity: true,
            format: "detailed"
        },

        textFiltering: {
            useRegex: true,
            bannedWordsSource: {
                cache: true,
                type: "string",
                string: "fuck,ass,nigga"
            }
        }
    },
});

async function test() {
    const fres = await muzzle.filterText("fuck me that is funny, my dawg you got my ass. This nigga");
    console.info(fres);
}

test();
