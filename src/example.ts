class MainClass {
    testMainClass() {
        alert("testMainClass");
    }
}

export const addSecondInheritance = (BaseClass: { new(...args) }) => {
    return class extends BaseClass {
        testSecondInheritance() {
            alert("testSecondInheritance");
        }
    }
}

// Prepare the new class, which "inherits" 2 classes (MainClass and the cass declared in the addSecondInheritance method)
const SecondInheritanceClass = addSecondInheritance(MainClass);
// Create object from the new prepared class
const secondInheritanceObj = new SecondInheritanceClass();
secondInheritanceObj.testMainClass();
secondInheritanceObj.testSecondInheritance();