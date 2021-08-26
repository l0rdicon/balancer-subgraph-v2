const fs = require("fs");

async function main() {
  const files = await fs.readdirSync("./contracts/avax");

  for (const file of files) {
    let data = await fs.readFileSync(`./contracts/avax/${file}`).toString();

    // Remove every line started with "// SPDX-License-Identifier:"
    data = data.replace(/SPDX-License-Identifier:/gm, "License-Identifier:");

    data = `// SPDX-License-Identifier: MIXED\n\n${data}`;

    // Remove every line started with "pragma experimental ABIEncoderV2;" except the first one
    data = data.replace(
      /pragma experimental ABIEncoderV2;\n/gm,
      ((i) => (m) => (!i++ ? m : ""))(0)
    );

    data = data.trim();
    fs.writeFileSync(`./contracts/avax/${file}`, data);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
