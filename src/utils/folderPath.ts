const date = new Date();
const currYear = date.getFullYear();
const currMonth = date.getMonth();

const folderPath = `${currYear}/${currMonth}`;

export default folderPath;
