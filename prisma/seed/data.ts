import {faker} from "@faker-js/faker";

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

export const products = [
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    }
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    }
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    }
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    }
  },
  {
    product: {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    }
  },
]