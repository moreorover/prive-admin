import { Faker } from "@faker-js/faker";

export const generateObjects = <T>(count: number, generator: () => T): T[] => {
  return Array.from({ length: count }, generator);
};

export const createCustomer = (faker: Faker) => {
  return {
    name: faker.person.fullName(),
  };
};

export const createProduct = (faker: Faker) => {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
  };
};

export const createProductVariant = (faker: Faker, size: string) => {
  return {
    size,
    price: faker.number.int({ min: 500, max: 20000 }),
    stock: faker.number.int({ min: 0, max: 100 }),
  };
};

export const createTransaction = (faker: Faker) => {
  return {
    name: faker.helpers.arrayElement(["Booking Fee", "Payment"]),
    amount: faker.number.float({
      min: -800,
      max: 800,
      multipleOf: 0.25,
    }),
    createdAt: faker.helpers.arrayElement([
      faker.date.recent(),
      faker.date.soon(),
    ]),
    type: faker.helpers.arrayElement(["BANK", "CASH", "PAYPAL"]),
  };
};

export const createAppointment = (faker: Faker) => {
  return {
    name: faker.helpers.arrayElement([
      "Consultation",
      "Correction",
      "New hair set",
    ]),
    notes: faker.helpers.arrayElement([faker.lorem.sentence(), null]),
    startsAt: faker.helpers.arrayElement([
      faker.date.recent(),
      faker.date.soon(),
    ]),
  };
};

export const sizes = ["250ml", "500ml", "50g", "100g", "1L"];
