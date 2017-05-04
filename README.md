# `wrap-xfreerdp`

## Overview

Installing Remmina on CentOS 7 is a pain, and `vinagre` is absolutely horrible. I RDP a ton at work, so I wrote this to simplify some of the commands. Yes, I could have aliased everything, but I also got to figure out `node` CLI via `minimist`. I'm also trying to move from vanilla JS to TS, and this was a perfect project.

You probably shouldn't use this.

## Installation

    git clone <repo>
    npm install

## Other stuff

This section is woefully outdated.

### Configs

#### `.editorconfig`

The excellent [Editor Config](http://editorconfig.org/) makes editor settings as consistent as possible.

    [*]
    # 4 spaces
    indent_style = space
    indent_size = 4
    # Consistent EOL
    end_of_line = lf
    # Consistent charset
    charset = utf-8
    # Consistent terminators
    trim_trailing_whitespace = true
    insert_final_newline = true
