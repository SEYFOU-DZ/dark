import http from "https";

const url = "https://res.cloudinary.com/hjm8tpoa/raw/upload/v1783037977/motor-quotes/test-quote-raw.pdf";

http.get(url, (res) => {
  console.log("STATUS CODE:", res.statusCode);
  console.log("HEADERS:", res.headers);
});
