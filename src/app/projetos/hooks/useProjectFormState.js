import { useState, useCallback } from "react";
import {
  buildEmptyGoal,
  buildEmptyStage,
  buildEmptyProduct,
  ensureAtLeastOne,
} from "../utils/projectDataHelpers";

export function useProjectFormState(initialState) {
  const [state, setState] = useState(initialState);

  const setContactField = useCallback((idx, key, value) => {
    setState((prev) => {
      const contacts = Array.isArray(prev.contacts) ? [...prev.contacts] : [];
      const row = { ...(contacts[idx] || {}) };
      row[key] = value;
      contacts[idx] = row;
      return { ...prev, contacts };
    });
  }, []);

  const addContactRow = useCallback(() => {
    setState((prev) => {
      const contacts = Array.isArray(prev.contacts) ? [...prev.contacts] : [];
      contacts.push({ name: "", email: "", phone: "" });
      return { ...prev, contacts };
    });
  }, []);

  const setGoalField = useCallback((goalIdx, key, value) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
      g[key] = value;
      goals[goalIdx] = g;
      return { ...prev, goals };
    });
  }, []);

  const addGoal = useCallback(() => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      goals.push(buildEmptyGoal());
      return { ...prev, goals };
    });
  }, []);

  const removeGoal = useCallback((goalIdx) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      goals.splice(goalIdx, 1);
      return { ...prev, goals: ensureAtLeastOne(goals, buildEmptyGoal) };
    });
  }, []);

  const setStageField = useCallback((goalIdx, stageIdx, key, value) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
      const stages = Array.isArray(g.stages)
        ? [...g.stages]
        : [buildEmptyStage()];
      const s = { ...(stages[stageIdx] || buildEmptyStage()) };
      s[key] = value;
      stages[stageIdx] = s;
      g.stages = stages;
      goals[goalIdx] = g;
      return { ...prev, goals };
    });
  }, []);

  const addStage = useCallback((goalIdx) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
      const stages = Array.isArray(g.stages) ? [...g.stages] : [];
      stages.push(buildEmptyStage());
      g.stages = stages;
      goals[goalIdx] = g;
      return { ...prev, goals };
    });
  }, []);

  const removeStage = useCallback((goalIdx, stageIdx) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
      const stages = Array.isArray(g.stages) ? [...g.stages] : [];
      stages.splice(stageIdx, 1);
      g.stages = ensureAtLeastOne(stages, buildEmptyStage);
      goals[goalIdx] = g;
      return { ...prev, goals };
    });
  }, []);

  const setProductField = useCallback(
    (goalIdx, stageIdx, prodIdx, key, value) => {
      setState((prev) => {
        const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
        const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
        const stages = Array.isArray(g.stages)
          ? [...g.stages]
          : [buildEmptyStage()];
        const s = { ...(stages[stageIdx] || buildEmptyStage()) };
        const products = Array.isArray(s.products)
          ? [...s.products]
          : [buildEmptyProduct()];
        const pr = { ...(products[prodIdx] || buildEmptyProduct()) };
        pr[key] = value;
        products[prodIdx] = pr;
        s.products = products;
        stages[stageIdx] = s;
        g.stages = stages;
        goals[goalIdx] = g;
        return { ...prev, goals };
      });
    },
    [],
  );

  const addProduct = useCallback((goalIdx, stageIdx) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
      const stages = Array.isArray(g.stages) ? [...g.stages] : [];
      const s = { ...(stages[stageIdx] || buildEmptyStage()) };
      const products = Array.isArray(s.products) ? [...s.products] : [];
      products.push(buildEmptyProduct());
      s.products = products;
      stages[stageIdx] = s;
      g.stages = stages;
      goals[goalIdx] = g;
      return { ...prev, goals };
    });
  }, []);

  const removeProduct = useCallback((goalIdx, stageIdx, prodIdx) => {
    setState((prev) => {
      const goals = Array.isArray(prev.goals) ? [...prev.goals] : [];
      const g = { ...(goals[goalIdx] || buildEmptyGoal()) };
      const stages = Array.isArray(g.stages) ? [...g.stages] : [];
      const s = { ...(stages[stageIdx] || buildEmptyStage()) };
      const products = Array.isArray(s.products) ? [...s.products] : [];
      products.splice(prodIdx, 1);
      s.products = ensureAtLeastOne(products, buildEmptyProduct);
      stages[stageIdx] = s;
      g.stages = stages;
      goals[goalIdx] = g;
      return { ...prev, goals };
    });
  }, []);

  const addBudgetItem = useCallback((key, template) => {
    setState((prev) => {
      const budget = { ...(prev.budget || {}) };
      const items = Array.isArray(budget[key]) ? [...budget[key]] : [];
      items.push({ ...template });
      budget[key] = items;
      return { ...prev, budget };
    });
  }, []);

  const setBudgetItemField = useCallback((key, idx, field, value) => {
    setState((prev) => {
      const budget = { ...(prev.budget || {}) };
      const items = Array.isArray(budget[key]) ? [...budget[key]] : [];
      const row = { ...(items[idx] || {}) };
      row[field] = value;

      const qty = Number(row.quantity || 0);
      const unitValue = Number(row.unitValue || 0);
      if (field === "quantity" || field === "unitValue") {
        const total =
          Number.isFinite(qty) && Number.isFinite(unitValue)
            ? qty * unitValue
            : 0;
        row.totalValue = total;
      }

      items[idx] = row;
      budget[key] = items;
      return { ...prev, budget };
    });
  }, []);

  const removeBudgetItem = useCallback((key, idx) => {
    setState((prev) => {
      const budget = { ...(prev.budget || {}) };
      const items = Array.isArray(budget[key]) ? [...budget[key]] : [];
      items.splice(idx, 1);
      budget[key] = items;
      return { ...prev, budget };
    });
  }, []);

  return {
    state,
    setState,
    setContactField,
    addContactRow,
    setGoalField,
    addGoal,
    removeGoal,
    setStageField,
    addStage,
    removeStage,
    setProductField,
    addProduct,
    removeProduct,
    addBudgetItem,
    setBudgetItemField,
    removeBudgetItem,
  };
}
