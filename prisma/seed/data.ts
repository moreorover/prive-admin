import {faker} from "@faker-js/faker";

faker.seed(628533);

// Customers with locations, controllers, and devices
export const customers = [
  {
    customer: {
      name: faker.person.fullName(),
    },
  },
  {
    customer: {
      name: faker.person.fullName(),
    },
  },
  {
    customer: {
      name: faker.person.fullName(),
    },
  },
];
