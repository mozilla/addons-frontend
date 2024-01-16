brand-name = Firefox
menu-save = Save

hello-world = Hello, world!

update-successful =
    { $userGender ->
        [masculine] { brand-name } został zaktualizowany.
        [feminine] { brand-name } została zaktualizowana.
        *[other] Program { brand-name } został zaktualizowany.
    }

sign-in = Sign in
cancel = Cancel

multi = Text can also span multiple lines as long as
    each new line is indented by at least one space.
    Because all lines in this message are indented
    by the same amount, all indentation will be
    removed from the final value.

unread-emails = You have
    { $emailCount ->
        [one]  one unread email.
       *[other] { $emailCount } unread emails.
    }

user-gender-select =
    { $userGender ->
        [male] his foo.
        [female] her foo.
        *[nonbinary] their foo.
    }

Informacje = Informacje o { brand-name }.

opening-brace = This message features an opening curly brace: {"{"}.

closing-brace = This message features a closing curly brace: {"}"}.

blank-is-removed =     This message starts with no blanks.

blank-is-preserved = {"    "}This message starts with 4 spaces.

time-elapsed-implicit = Time elapsed: { $duration }s.

time-elapsed-explicit = Time elapsed: { NUMBER($duration, maximumFractionDigits: 0) }s.

help-menu-save = Click { -menu-save } to save the file.

your-score =
    { NUMBER($score, minimumFractionDigits: 1) ->
        [0.0]   You scored zero points. What happened?
       *[other] You scored { NUMBER($score, minimumFractionDigits: 1) } points.
    }

your-rank = { NUMBER($pos, type: "ordinal") ->
   [1] You finished first!
   [one] You finished {$pos}st
   [two] You finished {$pos}nd
   [few] You finished {$pos}rd
  *[other] You finished {$pos}th
}

last-notice =
    Last checked: { DATETIME($lastChecked, day: "numeric", month: "long") }.

indents =
    Indentation common to all indented lines is removed
    from the final text value.
      This line has 2 spaces in front of it.




