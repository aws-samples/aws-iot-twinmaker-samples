# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import sqlparse

class SQLDetector:
    
    def getSubTokenCount(self, token):
        count = 0
        for _ in token.flatten():
            count += 1
        return count


    def getQueryContext(self, query):
        tokenContext = []
        statements = sqlparse.parse(query)
        for statement in statements:
            for token in statement.tokens:
                tokenContext.append(self.getSubTokenCount(token))
        return tokenContext


    def detectInjection(self, sampleQuery, query):
        """Detection potential SQL Injection by comparing token context of sample query and real time query.
        Note: whitespace tokens expected to match as well.

        Parameters
        ----------
            sampleQuery: string, required
                The query string represents normal single statement.
            query: string, required
                The real query string.

        Returns
        -------
            If token context changed, the method will throw Exception.

        Examples
        --------
            detector = SQLDetector()

            sample_query = "SELECT * FROM users WHERE userId = 'abc'"
            query = "SELECT * FROM users WHERE userId = 'abc_ef-gh'"

            detector.detectInjection(sample_query, query) # no issue, no exception

            query_injected = "SELECT * FROM users WHERE userId = 'abc' OR 1=1"
            detector.detectInjection(sample_query, query_injected) # Exception throws!
        """
        sampleTokenContext = self.getQueryContext(sampleQuery)
        tokenContext = self.getQueryContext(query)
        if not sampleTokenContext == tokenContext:
            raise Exception(f'Detected potential injection from query: {query}')

    
