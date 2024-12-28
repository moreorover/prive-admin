import { faker } from "@faker-js/faker";

faker.seed(628533);

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
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: generateUniqueVariants(2),
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: generateUniqueVariants(3),
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: generateUniqueVariants(1),
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: generateUniqueVariants(2),
    },
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      variants: generateUniqueVariants(3),
    },
  },
];
