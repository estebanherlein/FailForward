# Fail Forward: An Interactive Sci-Fi Journey

Fail Forward is an interactive, narrative-driven web experience built with vanilla JavaScript. It presents players with two distinct, choice-based sci-fi scenarios, each exploring themes of failure, consequence, and impossible decisions under pressure.

This project was developed not only as a creative endeavor but also as a technical showcase demonstrating a commitment to high-quality code, robust architecture, and modern development practices.

## Technical Philosophy & Strengths

This project was architected with the same rigor and discipline expected of a production-grade application. The goal was to demonstrate an ability to build scalable, maintainable, and well-tested software, even within the context of a vanilla JavaScript application.

### 1. Object-Oriented & Modular Architecture

The application is built on a foundation of clear, object-oriented principles to ensure separation of concerns and promote extensibility.

*   **Scene-Based Design**: The core logic is encapsulated within distinct `Scene` classes (`VagabondScene`, `DauntlessScene`). This makes each narrative experience a self-contained module.
*   **Inheritance and Polymorphism**: A `BaseScene` abstract class defines a common interface (`init`, `update`, `destroy`). This ensures that the main application loop can manage any scene without needing to know its specific implementation details, making it trivial to add new scenes in the future.
*   **Configuration Management**: All magic strings and configuration values (e.g., audio paths, game timers) are centralized in `config.js`. This improves maintainability and makes tuning the experience straightforward.

### 2. Comprehensive Unit Testing with Jest

A key focus of this project was to build a robust safety net through comprehensive unit testing. I believe that well-tested code is a prerequisite for quality and agility.

*   **High Test Coverage**: Both `VagabondScene` and `DauntlessScene` have dedicated test suites that cover critical logic, including:
    *   Initial state and setup (`start`).
    *   Core state transitions (e.g., star collapse, game over).
    *   Player interaction and choice-handling logic.
    *   Proper cleanup and teardown (`destroy`).
*   **Mocking and Isolation**: Dependencies on the DOM, audio, and global functions are fully mocked using Jest. This allows for fast, reliable tests that run in a `jsdom` environment without needing a real browser.
*   **Testing Shared Logic**: A separate test file for `BaseScene` verifies the common, inherited logic (like the timer and narrative event processing), adhering to the DRY principle within our test suite.

## How to Run

1.  Clone the repository.
2.  Open the `index.html` file in a modern web browser.

## How to Run Tests

The project is configured with Jest for unit testing.

1.  Install dependencies:
    ```sh
    npm install
    ```
2.  Run the test suite:
    ```sh
    npm test
    ```