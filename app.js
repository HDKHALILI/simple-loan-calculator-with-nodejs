const HTTP = require("http");
const URL = require("url").URL;
const PATH = require("path");
const FS = require("fs");
const HANDLEBARS = require("handlebars");

const PORT = 3000;
const APR = 5;
const MIME_TYPES = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const LOAN_SUMMARY_SOURCE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <table>
        <tbody>
          <tr>
            <th>Amount:</th>
            <td>
              <a href='/loan-offer?amount={{amountDecrement}}&&duration={{duration}}'>- $100</a>
            <td>
            <td>\${{amount}}</td>
            <td>
              <a href='/loan-offer?amount={{amountIncrement}}&duration={{duration}}'>+ $100</a>
            <td>
          </tr>
          <tr>
            <th>Duration:</th>
            <td>
              <a href='/loan-offer?amount={{amount}}&duration={{durationDecrement}}'>- 1 year</a>
            </td>
            <td>{{duration}}</td>
            <td>
              <a href='/loan-offer?amount={{amount}}&duration={{durationIncrement}}'>+ 1 year</a>
            <td>
          </tr>
          <tr>
            <th>APR:</th>
            <td colspan='3'>{{apr}}%</td>
          </tr>
          <tr>
            <th>Monthly payment</th>
            <td colspan='3'>\${{payment}}</td>
          <tr>
        </tbody>
      </table>
    </article>
  </body>
</html>`;

const LOAN_FORM_SOURCE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <form action="/loan-offer" method="post">
        <p> All loans are offered at an PAR of {{apr}}%.</p>
        <label for="amount">How much do you want to borrow (in dollars)?</label>
        <input type="number" name="amount" value="" id="amount">
        <label for="duration">How much time do you want to pay back your loan?</label>
        <input type="number" name="duration" value="" id="duration">
        <input type="submit" name="" value="Get loan offer!">
      <form>
    </article>
  </body>
</html>
`;

const LOAN_SUMMARY_TEMPLATE = HANDLEBARS.compile(LOAN_SUMMARY_SOURCE);
const LOAN_FORM_TEMPLATE = HANDLEBARS.compile(LOAN_FORM_SOURCE);

function render(template, data) {
  return template(data);
}

function parseFormData(request, callback) {
  let body = "";
  request.on("data", chunck => {
    body += chunck.toString();
  });

  request.on("end", () => {
    const params = new URLSearchParams(body);
    const data = {};
    data.amount = Number(params.get("amount"));
    data.duration = Number(params.get("duration"));

    callback(data);
  });
}

function getParams(path) {
  const host = `http://localhost:${PORT}`;
  const myURL = new URL(path, host);
  const params = myURL.searchParams;
  const amount = Number(params.get("amount"));
  const duration = Number(params.get("duration"));

  return { amount, duration };
}

function getPathname(path) {
  const host = `http://localhost:${PORT}`;
  const myURL = new URL(path, host);
  return myURL.pathname;
}

function calculateMonthlyPayment(data, apr) {
  const { amount, duration } = data;
  const annualIterestRate = apr / 100;
  const monthlyInterestRate = annualIterestRate / 12;
  const months = duration * 12;

  let payment =
    amount *
    (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -months)));

  return Number(payment.toFixed(2)) || 0;
}

function getLoanSummary(data) {
  data.amountIncrement = data.amount + 100;
  data.amountDecrement = data.amount - 100;
  data.durationIncrement = data.duration + 1;
  data.durationDecrement = data.duration - 1;
  data.apr = APR;
  data.payment = calculateMonthlyPayment(data, APR);

  return data;
}

function createIndex(res) {
  const content = render(LOAN_FORM_TEMPLATE, { apr: APR });

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  res.write(`${content}\n`);
  res.end();
}

function createLoanSummary4GET(res, path) {
  const data = getLoanSummary(getParams(path));
  const content = render(LOAN_SUMMARY_TEMPLATE, data);

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  res.write(`${content}\n`);
  res.end();
}

function createLoanSummary4POST(req, res) {
  parseFormData(req, parsedData => {
    const data = getLoanSummary(parsedData);
    const content = render(LOAN_SUMMARY_TEMPLATE, data);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.write(`${content}\n`);
    res.end();
  });
}

const SERVER = HTTP.createServer((req, res) => {
  const path = req.url;
  const pathname = getPathname(path);
  const fileExtension = PATH.extname(pathname);

  FS.readFile(`./public/${pathname}`, (err, data) => {
    if (data) {
      res.statusCode = 200;
      res.setHeader("Content-Type", `${MIME_TYPES[fileExtension]}`);
      res.write(`${data}\n`);
      res.end();
    } else {
      const method = req.method;
      if (method === "GET" && pathname === "/") {
        createIndex(res);
      } else if (method === "GET" && pathname === "/loan-offer") {
        createLoanSummary4GET(res, path);
      } else if (method === "POST" && pathname === "/loan-offer") {
        createLoanSummary4POST(req, res);
      } else {
        res.statusCode = 404;
        res.end();
      }
    }
  });
});

SERVER.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
