## cocos meta file git display

If the meta file is submitted and version control is done with git, CCC may automatically modify the meta when it is opened (even if you just pulled it from the latest version). The cause of this problem is that git is between the windows and linux systems The newline character is not the same.

windows newline \r\n

linux newline \n

We can manually set git so that the conversion line characters of the files of the two systems are automatically converted into the same one.

     git config --global core.autocrlf false

As long as we run the above sentence on the terminal of Linux (including mac) or cmd of windows, it will be fine.

If you still have questions, add this sentence:

    git config --global core.safecrlf false

[reference](https://www.cnblogs.com/gamedaybyday/p/15077680.html)

---
