const fs = require("fs");
const path = require("path");
const { keccak256 } = require("js-sha3");

function keccak(text) {
    return keccak256(text);
}

function generateSignatures(data) {
    const output = {};
    if (data.abi) {
        output.abi = data.abi;
        for (let item of data.abi) {
            if (["event", "error"].includes(item.type)) {
                const signature =
                    item.name +
                    "(" +
                    item.inputs.map((input) => input.type).join(",") +
                    ")";
                const fullHash = keccak(signature);
                item.signature =
                    item.type === "error"
                        ? "0x" + fullHash.substring(0, 8)
                        : "0x" + fullHash;
            }
        }
    }

    if (data.methodIdentifiers) {
        output.methodIdentifiers = data.methodIdentifiers;
    }
    return output;
}

function updateAbisWithSignatures(sourceDir, targetDir) {
    const items = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (let item of items) {
        const sourcePath = path.join(sourceDir, item.name);
        const targetPath = path.join(targetDir, item.name);

        if (item.isDirectory()) {
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            updateAbisWithSignatures(sourcePath, targetPath);
        } else if (item.name.endsWith(".json")) {
            const data = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
            const updatedData = generateSignatures(data);

            // Ensure the target directory exists before writing to the file
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.writeFileSync(targetPath, JSON.stringify(updatedData, null, 2));
        }
    }
}

const sourceDirectory = "abis_wo_signatures";
const targetDirectory = "abis";

updateAbisWithSignatures(sourceDirectory, targetDirectory);
