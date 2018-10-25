// const encodeMap = {
//   "0": "0000",
//   "1": "0001",
//   "2": "0010",
//   "3": "0011",
//   "4": "0100",
//   "5": "0101",
//   "6": "0110",
//   "7": "0111",
//   "8": "1000",
//   "9": "1001",
//   "+": "1010",
//   "-": "1011",
//   "*": "1100",
//   "/": "1101"
// }

const decodeMap = {
  "0000": "0",
  "0001": "1",
  "0010": "2",
  "0011": "3",
  "0100": "4",
  "0101": "5",
  "0110": "6",
  "0111": "7",
  "1000": "8",
  "1001": "9",
  "1010": "+",
  "1011": "-",
  "1100": "*",
  "1101": "/"
}

const sampleChromosome = "00100010101011101011011100101"



function decodeChromosome(chromosome) {
  const chromosomeArray = chromosome.match(/.{4}/g);
  const decodedOperators = chromosomeArray.map(chromosome => {
    return decodeMap[chromosome];
  })

  return filterGenes(decodedOperators).join(""); // returns a string that has numbers and operators filtered

}


function filterGenes(genes) {

  const numbers = "1234567890".split('');
  const operators = ["+", "-", "/", "*"];

  let value = "number";
  const filtered = [];
  genes.forEach(gene => {
    if (value === "number" && numbers.includes(gene)) {
      filtered.push(gene);
      value = "operator";
    } else if (value === "operator" && operators.includes(gene)) {
      filtered.push(gene);
      value = "number";
    }
  })
  return value === "number" ? filtered.slice(0, -1) : filtered
}


const evalStr = xs => {
  if (xs.length === 0) {
    return 0;
  }
  const ret = xs.split('').reduce((acc, x, i, src) => {
    const y = src[i+1];
    switch (x) {
    case '+':
      return y !== undefined ? Number(acc) + Number(y) : Number(acc)
    case '-':
      return y !== undefined ? Number(acc) - Number(y) : Number(acc)
    case '*':
      return y !== undefined ? Number(acc) * Number(y) : Number(acc)
    case '/':
      return y !== undefined ? Number(acc) / Number(y) : Number(acc)
    default:
      return Number(acc);
    }
  });
  return isNaN(ret) ? 0 : ret;
}

function chromosomeValue (chromosome) {
  return evalStr(decodeChromosome(chromosome));
}


// console.log(chromosomeValue(sampleChromosome)) // 9


function calcFitness (target, chromosome) {
  // console.log(chromosomeValue(chromosome), decodeChromosome(chromosome))
  return 1 / Math.abs(target - chromosomeValue(chromosome));
}


// console.log(calcFitness(42, "011010100101110001001101001010100001"))


// create chromosomes, 40 digits
function generateChromosome (length) {
  let count = 0;
  let chromosome = "";
  while (count < length) {
    chromosome += Math.round(Math.random()).toString();
    count ++
  }
  return chromosome;
}

function generateInitialPopulation (chromLength, popSize, target) {
  let count = 0;
  let chromPop = [];
  while (count < popSize) {
    const individual = {chromosome: generateChromosome(chromLength)};
    individual.fitness = calcFitness(target, individual.chromosome);
    chromPop.push(individual);
    count ++;
  }

  return generateRouletteChance(generateSelectionChance(chromPop));
}



function findTotalFitness (chromPop) {
  return chromPop.reduce((sum, individual) => {
    return sum + individual.fitness;
  }, 0)
}

function generateSelectionChance (chromPop) {
  const totalFitness = findTotalFitness(chromPop);
  return chromPop.map(individual => {
    individual.selectionChance = individual.fitness / totalFitness;
    return individual;
  })
}

function generateRouletteChance (chromPop) {
  let n = 0;
  return chromPop.map(individual => {
    n += individual.selectionChance;
    individual.rouletteChance = n;
    return individual;
  })
}


function selectIndividual (chromPop) {
  const r = Math.random();
  // console.log(r);
  for (let individual of chromPop) {
    if (individual.rouletteChance > r) {
      return individual;
    }
  } return chromPop[chromPop.length - 1];
}


function applyCrossoverRate (chromPop) {
  const r = Math.random();
  let individual1 = selectIndividual(chromPop);
  let individual2 = selectIndividual(chromPop);
  return r <= 0.7 ? swapGenes(individual1, individual2) : [{chromosome: individual1.chromosome}, {chromosome: individual2.chromosome}];
}

function swapGenes(individual1, individual2) {
  const geneIndex = Math.round(Math.random() * (individual1.chromosome.length - 1))
  let xOverIndividual1 = individual1.chromosome.slice(0, geneIndex) + individual2.chromosome.slice(geneIndex);
  let xOverIndividual2 = individual2.chromosome.slice(0, geneIndex) + individual1.chromosome.slice(geneIndex);
  return [{chromosome: xOverIndividual1}, {chromosome: xOverIndividual2}];
}



function mutateGenes(individual) {
  let mutatedChromosome = ""
  for (let gene of individual.chromosome) {
    let r = Math.random();
    if (r < .001) {
      switch (gene) {
        case "0":
          mutatedChromosome += "1"
          break;
        case "1":
          mutatedChromosome += "0"
          break;
      }
    } else {
      mutatedChromosome += gene;
    }
  }
  return {chromosome: mutatedChromosome};
}
// apply this after a full population

function generateNewPopulation (chromPop, target) {
  let n = chromPop.length;
  let newPop = [];
  while (newPop.length < n) {
    newPop = [...newPop, ...applyCrossoverRate(chromPop)]
  }
  newPop = newPop.map(individual => {
    individual = mutateGenes(individual);
    individual.fitness = calcFitness(target, individual.chromosome);
    return individual;
  })
  return generateRouletteChance(generateSelectionChance(newPop));
}


// const newPopulation = generateNewPopulation(pop, 20);
// console.log(newPopulation);
// console.log("this is the new population")


// run into a few scenarios where we get undefined
function generateGenerations (chromLength, popSize, target, genNum) {
  let pop = generateInitialPopulation(popSize, target);
  for (let gen = 0; gen < genNum; gen ++) {
    console.log(gen);
    pop = generateNewPopulation(pop, target);
  }
  pop.sort((a, b) => {a.fitness - b.fitness});
  return pop;
}

let lastGen = generateGenerations(100, 100, 100, 10000);
console.log(lastGen[0]);
console.log(decodeChromosome(lastGen[0].chromosome));



