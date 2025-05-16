// import dayjs from "dayjs";
// import timezone from "dayjs/plugin/timezone";
// import utc from "dayjs/plugin/utc";
//
// dayjs.extend(utc);
// dayjs.extend(timezone);
//
// // Set the global timezone
// dayjs.tz.setDefault("Europe/London");
//
// export default dayjs;
//
//

import dayjs from "dayjs";
import "dayjs/locale/en";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.locale("en");
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);
const day = dayjs;
export default day;
