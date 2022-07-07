pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib-matrix/circuits/matMul.circom"; // hint: you can use more than one templates in circomlib-matrix to help you

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    // [bonus] insert your code here
    component mul = matMul(n,n,1);
    for (var i=0; i<n; i++) {
        for (var j=0; j<n; j++) {
            mul.a[i][j] <== A[i][j];
        }
        mul.b[i][0] <== x[i];
    }

    // create signal for accumulating the sum of Ax-b 
    // that should be 0 at the end if x is a solution for the system linear equations
    signal sum[n];
    sum[0] <== mul.out[0][0] - x[0]; // assign Ax-b = 0 if x is solution
    
    for (var i=1; i<n; i++) {
        sum[i] <== sum[i-1] + mul.out[i][0] - x[i]; // accumulate the sum of Ax-b 
    }

    // check if the last accumulated sum is 0
    component iszero = IsZero();
    iszero.in <== sum[n-1];
    out <== iszero.out;
}

component main {public [A, b]} = SystemOfEquations(3);