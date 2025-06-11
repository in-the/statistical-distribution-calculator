# Calculator for Statistical Distributions

Sometimes it's hard to get my head around the dpqr functions in R. Sometimes I want to have an overview of some distribution, without writing an R script.

I made this small bare-bones web app which implements dpqr for 5 discrete distributions: Bare bones. Covers Binomial, Poisson, Geometric, Negative Binomial, Hypergeometric. Gives a table and a graph for the PMF and CDF. Also gives some nice information about the distributions at the bottom.

Implemented using arbitrary-precision arithmetic, except Poisson which involves powers of e, because I don't know how to do exponents in arbitrary-precision properly. The powers of e are calculated with JS's double precision floating point numbers instead, which should give good enough precision.

Plans:
- Better website design - Low priority
- CSS maths formatting instead of plain text - Low priority
- Implement other discrete distributions like Multinomial. I just need to think about how to design inputs for an arbitrary number of parameters. - Low priority
- Implement continuous distributions. Would involve implementing numerical methods of integration. I'll do it if I'm interested. - Medium priority

- Wei Chen 2025, BDSc (Class 1 Hons), MD2 UQ