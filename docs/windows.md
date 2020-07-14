# Windows

In order to work on addons-frontend on Windows (10), you must:

1. [install the Windows Subsystem for Linux (WSL) version 1](https://medium.com/@gmusumeci/linux-on-windows-totally-how-to-install-wsl-1-and-wsl-2-307c9dd38a36)
2. [use the Ubuntu 18 LTS distribution](https://www.microsoft.com/store/apps/9N9TNGVNDL3Q)

_Note 1: it is important to not have Node.js or Yarn installed on your main Windows system because these tools are available in WSL and can conflict with the tools installed in WSL itself._

_Note 2: it might work with WSL 2 or a different distribution but it is not the recommended setup as we cannot test all the different combinations._

Next, open Ubuntu and install Node.js and Yarn (this is pretty standard but those commands have been tested when writing this guide):

```
$ curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
$ sudo apt update
$ sudo apt-get install -y nodejs gcc g++ make yarn
```

Your (sub-)system is now ready and you can follow the [common instructions to get started](https://github.com/mozilla/addons-frontend#get-started).

## Troubleshooting

### Running `yarn` fails with an `EPERM` error

This can be caused by Yarn being installed on the main Windows system _or_ a cache issue. Make sure to use the `yarn` CLI installed as described in the previous section. You can also try to delete your yarn cache:

```
$ rm -r ~/.cache/yarn/
```

When such an error occurs, it is also best to remove the `node_modules/` folder before re-running `yarn`.
