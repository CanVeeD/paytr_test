const jsSHA = require("jssha");
const { default: axios } = require("axios");

const express = require("express");
const app = express();

const port = 4422;

app.listen(port, () => {
  console.log(`Paytr app listening at http://localhost:${port}`);
});

const merchant_params = {
  merchant_id: "239795",
  merchant_key: "pRM8SNcfoXnH2gea",
  merchant_salt: "ejmyab5uktQ4ds2W",
  debug_on: true,
  no_installment: 1,
  max_installment: 0,
  test_mode: 1,
  timeout_limit: 29,
};

const user_params = {
  user_ip: "5.191.52.208",
  user_name: "Aga",
  user_address: "Yasamal",
  user_phone: "0502188512",
  user_basket: [["Sample Product 1", "18.00", 1]],
  merchant_oid: "dkasijdiasjdiasjd",
  email: "test@mail.ru",
  payment_amount: 20,
  currency: "TL",
  merchant_ok_url: "http://localhost:4545/callback",
  merchant_fail_url: "http://localhost:4545/callback",
};

const estimateHash = (str, key) => {
  var shaObj = new jsSHA("SHA-256", "TEXT");
  shaObj.setHMACKey(key, "TEXT");
  shaObj.update(str);
  return shaObj.getHMAC("B64");
};

const getToken = () => {
  var {
    merchant_id,
    merchant_key,
    merchant_salt,
    no_installment,
    max_installment,
    debug_on,
    timeout_limit,
    test_mode,
  } = merchant_params;
  var {
    user_ip,
    user_name,
    user_address,
    user_phone,
    user_basket,
    merchant_oid,
    email,
    payment_amount,
    currency,
    merchant_ok_url,
    merchant_fail_url,
  } = user_params;

  if (typeof user_basket == "object")
    try {
      user_basket = JSON.stringify(user_basket);
    } catch (e) {
      console.error(e);
    }

  var user_basket = Buffer.from(user_basket).toString("base64");

  const hash_str = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
  const paytr_token = estimateHash(`${hash_str}${merchant_salt}`, merchant_key);
  const options = {
    url: "https://www.paytr.com/odeme/api/get-token",
    formData: {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      paytr_token,
      user_basket,
      debug_on,
      no_installment,
      max_installment,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      timeout_limit,
      currency,
      test_mode,
    },
  };
  var nullValues = Object.entries(options.formData).filter(([key, value]) =>
    [undefined, null, ""].includes(value)
  );
  if (nullValues.length > 0) {
    throw new Error(
      "getToken params cannot includes null, undefined or empty string."
    );
  }
  console.log(options);
  axios({
    method: "post",
    url: options.url,
    data: options.formData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
    .then(function ({ response }) {
      //handle success
      console.log(response);
    })
    .catch(function ({ response }) {
      //handle error
      console.log("ERROR");
      console.log(response);
    });
};

const getPost = (params, callback) => {
  const { merchant_key, merchant_salt } = merchant_params;
  const { hash, merchant_oid, status, total_amount } = params;
  const estimatedHash = estimateHash(
    `${merchant_oid}${merchant_salt}${status}${total_amount}`,
    merchant_key
  );
  if (hash === estimatedHash) {
    callback(params);
  } else {
    throw new Error("Hash value not equal");
  }
};

getToken();
