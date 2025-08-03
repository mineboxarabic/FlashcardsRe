# Spaced Repetition Algorithm: A Technical Deep-Dive

This document provides a detailed technical explanation of the spaced repetition algorithm implemented in `src/components/StudySession.tsx`. Its purpose is to help you understand the system's logic, predict data outcomes, and test the application effectively.

The algorithm is a modified version of the popular SM-2 algorithm, corrected for clarity and predictability.

---

## 1. Core Card Attributes

The scheduling for each card is determined by several key attributes stored in the `cards` table in your database.

-   **`ease_factor`**: A number representing how "easy" a card is. It directly influences how quickly the review interval grows.
    -   **Default Value for New Cards**: `2.5`
    -   **Range**: Clamped between `1.3` and `2.5`. A lower value means the card is harder.

-   **`interval`**: The number of days until the card should be reviewed again after a successful recall.
    -   **Default Value for New Cards**: `0`

-   **`review_count`**: A simple counter for how many times a card has been reviewed.
    -   **Default Value for New Cards**: `0`

-   **`correct_count`**: A counter for how many times a card was graded as "Hard", "Good", or "Easy". This is a streak of successful recalls.
    -   **Default Value for New Cards**: `0`

-   **`next_review_date`**: The specific date the card is scheduled to be reviewed next.
    -   **Default Value for New Cards**: `null`

---

## 2. The Grading Buttons: Core Logic Breakdown

During a study session, your rating of a card is the primary input for the algorithm. Here is exactly what happens for each grade.

### Grade 1: "Again" (You forgot)

This is a **failed recall**. It resets the card's learning progress.

-   **`review_count`**: Increments by 1.
-   **`correct_count`**: Does **not** increment.
-   **`ease_factor`**: Decreases by `0.20`. (e.g., `2.5 -> 2.3`)
-   **`interval`**: Resets to **1 day**.
-   **`next_review_date`**: Set to **tomorrow**.

### Grades 2, 3, and 4: "Hard", "Good", "Easy"

These are all considered **successful recalls**. They share a base logic but have different modifiers.

-   **`review_count`**: Increments by 1.
-   **`correct_count`**: Increments by 1.
-   **`ease_factor`**: Adjusted once using the formula: `EF' = EF + [0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)]`.
    -   **Hard (grade 2):** `ease_factor` decreases by `0.14`.
    -   **Good (grade 3):** `ease_factor` decreases by `0.02`.
    -   **Easy (grade 4):** `ease_factor` increases by `0.10`.
-   **`interval`**:
    -   If it's the **first successful review** (`correct_count` was 0): New interval is **1 day**.
    -   If it's the **second successful review** (`correct_count` was 1): New interval is **6 days**.
    -   For all subsequent successful reviews: New interval is `round(previous_interval * ease_factor)`.
-   **Interval Modifiers (Applied *after* the base calculation):**
    -   If graded **"Hard"**: The new interval is reduced: `round(new_interval * 0.8)`.
    -   If graded **"Easy"**: The new interval gets a bonus: `round(new_interval * 1.3)`.

---

## 3. Example Progression

Let's trace a new card (Ease: 2.5, Interval: 0, Correct Count: 0) through a few reviews.

1.  **Review 1:** You grade it **"Good" (grade 3)**.
    -   `review_count`: 1, `correct_count`: 1
    -   `ease_factor`: `2.5 - 0.02` = 2.48
    -   `interval`: **1 day** (first success)
    -   `next_review_date`: Tomorrow

2.  **Review 2 (after 1 day):** You grade it **"Good" (grade 3)** again.
    -   `review_count`: 2, `correct_count`: 2
    -   `ease_factor`: `2.48 - 0.02` = 2.46
    -   `interval`: **6 days** (second success)
    -   `next_review_date`: 6 days from now

3.  **Review 3 (after 6 days):** You grade it **"Easy" (grade 4)**.
    -   `review_count`: 3, `correct_count`: 3
    -   `ease_factor`: `2.46 + 0.10` = 2.5 (clamped at 2.5)
    -   Base Interval: `round(6 * 2.46)` = 15 days
    -   Final Interval (with "Easy" bonus): `round(15 * 1.3)` = **20 days**
    -   `next_review_date`: 20 days from now

4.  **Review 4 (after 20 days):** You grade it **"Hard" (grade 2)**.
    -   `review_count`: 4, `correct_count`: 4
    -   `ease_factor`: `2.5 - 0.14` = 2.36
    -   Base Interval: `round(20 * 2.5)` = 50 days
    -   Final Interval (with "Hard" penalty): `round(50 * 0.8)` = **40 days**
    -   `next_review_date`: 40 days from now

5.  **Review 5 (after 40 days):** You grade it **"Again" (grade 1)**.
    -   `review_count`: 5, `correct_count`: 4 (does not increment)
    -   `ease_factor`: `2.36 - 0.20` = 2.16
    -   `interval`: **1 day** (resets on failure)
    -   `next_review_date`: Tomorrow

---

## 4. Special Actions & Use Cases

### "Reset Progress" Button

This action is found on the `Card Details` page. It is designed to reset a card's learning history.

-   **What it RESETS:**
    -   `review_count` is set to `0`.
    -   `correct_count` is set to `0`.
    -   `last_reviewed` is set to `null`.

-   **What it DOES NOT RESET:**
    -   `ease_factor`
    -   `interval`
    -   `next_review_date`

**Testing Implication:** If you reset a card that has a 30-day interval, it will still have a 30-day interval. It will not appear in your "due" queue until that date passes. To fully reset a card to its "new" state for testing, you would need to manually update the `interval` and `ease_factor` in the database or grade it as "Again" in a study session.

### How "Due" Cards Are Selected

A card is considered "due" and will appear in a "Due Cards" study session if either of these conditions is true:
1.  `next_review_date` is `null` (i.e., it's a new card).
2.  `next_review_date` is in the past or is today.