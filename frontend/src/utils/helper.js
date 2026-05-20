import moment from "moment";

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// export const getInitials =(name)=>{
// if(!name) return "";

// const words = name.split(" ")
// let initials="";
// for(let i=0;i<Math.min(words.length,2);i++) {
//   initials += words[i][0];
// }
// return initials.toUpperCase();
// };

export const getInitials = (name = "") => {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
};

export const addThousandsSeparator = (num) => {
  if (num == null || isNaN(num)) return "";

  const [integerPart, fractionalPart] = num.toString().split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3}))/g, ",");

  return fractionalPart
    ? `${formattedInteger}.${fractionalPart}`
    : formattedInteger;

};


export const prepareExpenseBarChardata = (data = []) => {
  const charData = data.map((item) => ({
    catrgory: item?.catrgory,
    amount: item?.amount,
  }));
  return charData;
};

export const prepareIncomeBarChartData = (data = []) => {
  if (!Array.isArray(data)) return [];

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return sortedData.map((item) => ({
    month: moment(item?.date).format("Do MMM"),
    amount: item?.amount,
    source: item?.source,
  }));
};

export const prepareExpenseLineChartData = (data = []) => {
  if (!Array.isArray(data)) return []; 

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return sortedData.map((item) => ({
    month: moment(item?.date).format("Do MMM"),
    amount: item?.amount,
    category: item?.category,
  }));

}