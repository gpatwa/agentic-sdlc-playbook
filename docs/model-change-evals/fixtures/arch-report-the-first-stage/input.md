# Task: define the evidence for a second retrieval stage

Slice context: retrieval currently returns the top 5 files from a first-stage method (a hybrid of lexical and embedding ranks).
The proposal adds a reranker as a second stage, at a cost of about 2.3 to 3.8 seconds a question against 0.9 seconds for the
first stage alone. The proposed gate: "the correct file is in the top 5 for at least 13 of 16 questions on the held-out set."

Write the section that says how the added stage will be judged, and what the report must contain.
