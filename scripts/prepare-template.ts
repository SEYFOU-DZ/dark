import { prepareBlankTemplate } from "../src/lib/pdf-generator";

async function main() {
  await prepareBlankTemplate();
  console.log("Template ready: public/templates/quote-template.pdf");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
