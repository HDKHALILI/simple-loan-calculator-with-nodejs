const HTTP = require("http");
const URL = require("url").URL;

const PORT = 3000;
const HTML_START = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <style type="text/css">
      body {
        background: rgba(250, 250, 250);
        font-family: sans-serif;
        color: rgb(50, 50, 50);
      }

      article {
        width: 100%;
        max-width: 40rem;
        margin: 0 auto;
        padding: 1rem 2rem;
      }

      h1 {
        font-size: 2.5rem;
        text-align: center;
      }

      table {
        font-size: 2rem;
      }

      th {
        text-align: right;
      }
    </style>
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <table>
        <tbody>`;

const HTML_END = `
        </tbody>
      </table>
    </article>
  </body>
</html>`;

function getParams(path, host) {
  const myURL = new URL(path, `http://${host}`);
  const params = myURL.searchParams;
  const amount = Number(params.get("amount"));
  const duration = Number(params.get("duration"));

  return [amount, duration];
}

function calculateMonthlyPayment(amount, duration, apr) {
  const annualIterestRate = apr / 100;
  const monthlyInterestRate = annualIterestRate / 12;
  const months = duration * 12;

  let payment =
    amount *
    (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -months)));

  return Number(payment.toFixed(2)) || 0;
}

function getLoanSummary(amount, duration) {
  const APR = 5;
  const payment = calculateMonthlyPayment(amount, duration, APR);

  let summary = "";
  summary += getAmountTableRow(amount, duration);
  summary += getDurationTableRow(amount, duration);
  summary += getTableRow("APR", `${APR}%`);
  summary += getTableRow("Monthly repayment", `$${payment}`);

  return `${HTML_START}${summary}${HTML_END}`;
}

function getAmountTableRow(amount, duration) {
  return `
  <tr>
    <th>Amount</th>
    <td>
      <a href='/?amount=${amount - 100}&duration=${duration}'>- 100</a>
    </td>
    <td>$${amount}</td>
    <td>
      <a href='/?amount=${amount + 100}&duration=${duration}'>+ $100</a>
    </td>
  </tr>
`;
}

function getDurationTableRow(amount, duration) {
  return `
  <tr>
    <th>Duration</th>
    <td>
      <a href='/?amount=${amount}&duration=${duration - 1}'>- 1 year</a>
    </td>
    <td>$${duration}</td>
    <td>
      <a href='/?amount=${amount}&duration=${duration + 1}'>+ 1 year</a>
    </td>
  </tr>
`;
}

function getTableRow(header, data) {
  return `
      <tr>
        <th>${header}</th>
        <td colspan='3'>${data}</td>
      </tr>
    `;
}

const SERVER = HTTP.createServer((req, res) => {
  const path = req.url;
  const host = req.headers.host;
  const [amount, duration] = getParams(path, host);

  if (path === "/favicon.ico") {
    res.statusCode = 404;
    res.end();
  } else {
    const loanSummary = getLoanSummary(amount, duration);
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.write(loanSummary);
    res.end();
  }
});

SERVER.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
