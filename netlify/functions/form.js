const querystring = require("querystring");
const axios = require("axios");

const END_POINT = "https://www.zohoapis.com/crm/v2/Leads";
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_ACCOUNT_OWNER = process.env.ZOHO_ACCOUNT_OWNER;
const AUTH_END_POINT = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${ZOHO_REFRESH_TOKEN}&client_id=${ZOHO_CLIENT_ID}&client_secret=${ZOHO_CLIENT_SECRET}&grant_type=refresh_token`;

exports.handler = async function (event, context, callback) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  console.log(event.body);

  const params = JSON.parse(event.body);

  console.log(params);

  const formdata = getFormData(params);

  console.log({ formdata });

  const postBody = {
    data: [formdata],
  };

  const response = await saveToZoho(postBody);
  const airtableResponse = await sendToAirtable(params);

  console.log(response, airtableResponse);

  // accept form data
  // const body = JSON.parse(event.body).payload

  return {
    statusCode: 201,
    body: JSON.stringify({ success: true }),
  };
};

async function sendToAirtable(params) {
  const body = {
    name: params.data.name,
    email: params.data.email,
    phone: params.data.phone,
    company: params.data.company,
    city: params.data.city,
    country: params.data.country,
    requirements: params.data.requirements,
    empcount: params.data.empcount,
  };

  const response = await axios.post(
    "https://hooks.airtable.com/workflows/v1/genericWebhook/app3takXUa8pF69Jq/wfl93m9wlUHlDVP8Y/wtrGnOZRmTNruA2f7",
    body,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

async function saveToZoho(postBody) {
  const auth_details = await axios.post(encodeURI(AUTH_END_POINT));

  const header = {
    Authorization: "Zoho-oauthtoken " + auth_details.data.access_token,
  };

  console.log({ header });

  const response = await axios.post(END_POINT, postBody, { headers: header });
  return response.data;
}

function getFormData(params) {
  let formdata = {};

  if (params.form_name === "getting-started-cta") {
    formdata = {
      Last_Name: params.data.name,
      Email: params.data.email,
      Company: params.data.company,
      Phone: params.data.phone,
      Lead_Status: "Not Contacted",
      Lead_Source: "easyHR",
      Product: "EasyHR",
    };
  }

  if (
    params.form_name === "pricing-info" ||
    params.form_name === "free-trial" ||
    params.form_name === "demo-contact"
  ) {
    formdata = {
      Last_Name: params.data.name,
      Email: params.data.email,
      Phone: params.data.phone,
      Description: params.data.message,
      Company: params.data.company,
      City: params.data.city,
      Country: params.data.country,
      Description: params.data.requirements,
      Lead_Status: "Not Contacted",
      Lead_Source: "easyHR",
      Owner: ZOHO_ACCOUNT_OWNER,
      Product: "EasyHR",
    };

    switch (params.empcount) {
      case "1-10":
        formdata.No_of_Employees = 10;
        break;

      case "11-50":
        formdata.No_of_Employees = 11;
        break;

      case "51-100":
        formdata.No_of_Employees = 51;
        break;

      case "101-250":
        formdata.No_of_Employees = 101;
        break;

      case "251-500":
        formdata.No_of_Employees = 251;
        break;

      case "500+":
        formdata.No_of_Employees = 500;
        break;

      default:
        formdata.No_of_Employees = 0;
        break;
    }
  }

  if (params.form_name === "city-contact-callback") {
    formdata = {
      Last_Name: params.data.name,
      Email: params.data.email,
      Phone: params.data.phone,
      Company: params.data.company,
      City: params.data.city,
      Lead_Status: "Not Contacted",
      Lead_Source: "easyHR",
      Product: "EasyHR",
    };
  }
  return formdata;
}
