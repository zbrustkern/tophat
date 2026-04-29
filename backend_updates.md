# Backend Updates for 529 College Savings Calculator

This document outlines the required updates to the Python cloud functions to support the new `college` plan type in the Tophat application.

## 1. Plan Type Extension
The backend validation or schema definition for a `PlanType` needs to be extended to include `'college'`. Currently, it likely only supports `'income'` and `'savings'`.
- Update the allowed values in your Pydantic/dataclass schema or wherever the string literals are validated.
- ```python
  PlanType = Literal['income', 'savings', 'college']
  ```

## 2. College Plan Details Schema
Create a new schema to validate the `details` field specifically for the `'college'` plan type. The payload from the frontend will look like this:

```python
class CollegeDetails(BaseModel):
    calculationMode: Literal['goal', 'contribution']
    childAge: float
    collegeAge: float
    currentBalance: float
    returnRate: float
    targetAmount: float
    monthlyContribution: float
```

## 3. Database Operations
The `create_plan`, `update_plan`, `read_plan`, and `list_plans` functions should work seamlessly without modification if they are generic, provided the schema validations are updated. However:
- If your Cloud Functions validate the payload contents explicitly before inserting into Firestore, add a switch case for the `'college'` plan to apply the `CollegeDetails` schema check.
- If you compute derived properties on the backend upon save, you will need to add the calculation logic for the College Plan (equivalent to `useCollegeCalculations` on the frontend).

## 4. Default Field Values Reference
When processing or mocking a default plan, be aware of the default state:
```json
{
  "planType": "college",
  "details": {
    "calculationMode": "goal",
    "childAge": 0,
    "collegeAge": 18,
    "currentBalance": 0,
    "returnRate": 0.07,
    "targetAmount": 100000,
    "monthlyContribution": 500
  }
}
```

These changes will ensure that the Python backend fully supports saving and listing the newly added 529 College Calculator plans alongside the existing retirement calculators.