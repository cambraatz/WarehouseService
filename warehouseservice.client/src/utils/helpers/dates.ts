export const getDate_Str = () => {
    const now = new Date();
    const year: number = now.getFullYear();

    const month: number = now.getMonth() + 1;
    const month_str: string = month.toString().padStart(2, "0");

    const day: number = now.getDate();
    const day_str: string = day.toString().padStart(2, "0");

    const currDate: string = [year, month_str, day_str].join("-");
    return currDate;
};

/*export const getDate_Dt = (date: string) => {
    const year: string = date.slice(0,4);
    const month: string = date.slice(5,7);
    const day: string = date.slice(8);
    return [year,month,day].join("-");
};*/

export const getDate_Db = (date: string) => {
    if (!date) { return null; }
    const year: string = date.slice(0,4);
    const month: string = date.slice(5,7);
    const day: string = date.slice(8);
    return month+day+year;
};