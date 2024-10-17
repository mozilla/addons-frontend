simple = Hello World!

# $term-name-2s23k (String) - The name of the user
-name = World

# $ref (String) - A specific reference
with-variable-reference = Hello { $ref }!

with-term-reference = Hello { -term-name-2s23k }!

gendered-stream =
  { $selector-fdk23 ->
    [male] her stream { -name }
    [female] his stream
    [other] their stream { $selectyor-fdk23 }
