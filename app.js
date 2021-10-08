const HTTP = require("http");
const URL = require("url").URL;
const HANDLEBARS = require("handlebars");

const PORT = 3000;
const APR = 5;
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
      <form action="/loan-offer" method="get">
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

function getParams(path, host) {
  const myURL = new URL(path, `http://${host}`);
  const params = myURL.searchParams;
  const amount = Number(params.get("amount"));
  const duration = Number(params.get("duration"));

  return [amount, duration];
}

function getPathname(path, host) {
  const myURL = new URL(path, `http://${host}`);
  return myURL.pathname;
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
  const data = {};

  data.amount = amount;
  data.amountIncrement = data.amount + 100;
  data.amountDecrement = data.amount - 100;
  data.duration = duration;
  data.durationIncrement = data.duration + 1;
  data.durationDecrement = data.duration - 1;
  data.apr = APR;
  data.payment = calculateMonthlyPayment(amount, duration, APR);

  return data;
}

const SERVER = HTTP.createServer((req, res) => {
  const path = req.url;
  const host = req.headers.host;
  const [amount, duration] = getParams(path, host);
  const pathname = getPathname(path, host);

  if (pathname === "/") {
    const content = render(LOAN_FORM_TEMPLATE, { apr: APR });

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.write(`${content}\n`);
    res.end();
  } else if (pathname === "/loan-offer") {
    const data = getLoanSummary(amount, duration);
    const content = render(LOAN_SUMMARY_TEMPLATE, data);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.write(`${content}\n`);
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
});

SERVER.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
