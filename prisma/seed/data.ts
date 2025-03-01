import { faker } from "@faker-js/faker";

faker.seed(410149);

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

const sizes = ["250ml", "500ml", "50g", "100g", "1L"];

function generateUniqueVariants(variantCount: number) {
  const uniqueCount = Math.min(sizes.length, variantCount); // Ensure we don't exceed available sizes
  const selectedSizes = faker.helpers.arrayElements(sizes, uniqueCount);
  return selectedSizes.map((size) => ({
    size,
    price: faker.number.int({ min: 500, max: 20000 }),
    stock: faker.number.int({ min: 0, max: 100 }),
  }));
}

export const products = [
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(2),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(3),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(1),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(2),
  },
  {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    variants: generateUniqueVariants(3),
  },
];

const transactionName = ["Booking Fee", "Payment"];

export const generateTransactions = (count: number) => {
  return Array.from({ length: count }).map(() => {
    const amount = faker.number.float({
      min: -800,
      max: 800,
      multipleOf: 0.25,
    });
    return {
      name: faker.helpers.arrayElement(transactionName),
      amount,
      createdAt: faker.helpers.arrayElement([
        faker.date.recent(),
        faker.date.soon(),
      ]),
    };
  });
};

export const transactions = generateTransactions(40);
