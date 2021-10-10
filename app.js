const HTTP = require("http");
const URL = require("url").URL;
const ROUTER = require("router");
const FINALHANDLER = require("finalhandler");
const SERVE_STATIC = require("serve-static");
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
const NOT_FOUND_TEMPLATE = `
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>NOT FOUND</title>
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  <div class="not-found">
    <h1>404 Not Found!</h1>
    <a href="/">HOME</a>
  <div>
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

const router = ROUTER();
router.use(SERVE_STATIC("public"));

router.get("/", (req, res) => {
  const content = render(LOAN_FORM_TEMPLATE, { apr: APR });

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  res.write(`${content}\n`);
  res.end();
});

router.get("/loan-offer", (req, res) => {
  const data = getLoanSummary(getParams(req.url));
  const content = render(LOAN_SUMMARY_TEMPLATE, data);

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html;charset=utf-8");
  res.write(`${content}\n`);
  res.end();
});

router.post("/loan-offer", (req, res) => {
  parseFormData(req, parsedData => {
    const data = getLoanSummary(parsedData);
    const content = render(LOAN_SUMMARY_TEMPLATE, data);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.write(`${content}\n`);
    res.end();
  });
});

const SERVER = HTTP.createServer((req, res) => {
  router(req, res, FINALHANDLER(req, res));
});

router.get("*", (req, res) => {
  res.statusCode = 404;
  res.write(`${NOT_FOUND_TEMPLATE}`);
  res.end();
});

SERVER.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
