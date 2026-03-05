export function buildEmptyGoal() {
  return {
    title: "",
    description: "",
    indicatorTarget: "",
    monthStart: "",
    monthEnd: "",
    stages: [buildEmptyStage()],
  };
}

export function buildEmptyStage() {
  return {
    title: "",
    description: "",
    monthStart: "",
    monthEnd: "",
    products: [buildEmptyProduct()],
  };
}

export function buildEmptyProduct() {
  return {
    deliverable: "",
    indicatorTarget: "",
    verificationSource: "",
  };
}

export function ensureAtLeastOne(arr, buildFn) {
  if (Array.isArray(arr) && arr.length > 0) {
    return arr;
  }
  return [buildFn()];
}
