<br />
<p align="center">
    <a href="https://synnaxlabs.com/">
        <img src="docs/media/logo/title-white-on-black.svg" width="45%"/>
    </a>

</p>


# Synnax
<a href="https://app.codecov.io/gh/synnaxlabs/synnax">
  <img src="https://img.shields.io/codecov/c/gh/synnaxlabs/synnax?token=6xqpN1pFt8&color=green&style=flat-square&logo=codecov" />
</a>

<a href="https://docs.synnaxlabs.com">
<img src="https://img.shields.io/badge/_-documentation-3b84e5?style=flat-square&link=https://docs.synnaxlabs.com&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfmCg0KKDIsDui/AAAA2UlEQVQY023QLUtDARjF8ecOp4jrirCiIJgMCybLikUsBoPBaFkWBKNpyWhZMi74An4DMSkoLIgYLKKiMMbmS9rPcG+4u3rq/5zD85yITEJo6NsRoiCh6hbXZv1BYR8M7RaywqInNxruPFowgkoOfVkXNnxrKslVLnvXNilMOfWmllULE451rUiNdT0tZVluVd+RMam1rKWnnsKKC8+W0iIh1Lw6UQlh048Difx5TZ+2w7RLD+aMPjbvSifsGTozrjhJ1VbiJWaiG+34iCTHO3Eeg3DvPw2siV92RsVo+XSmkwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0xMC0xM1QxMDo0MDo1MCswMDowMIzzdxUAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMTAtMTNUMTA6NDA6NTArMDA6MDD9rs+pAAAAAElFTkSuQmCC" />
</a>

The telemetry engine for operating large scale hardware systems with ease.

* [What is Synnax?](#what-is-synnax)
* [Get Started](https://docs.synnaxlabs.com)
* [Architectural Concepts](https://docs.synnaxlabs.com/concepts)
* [How to Contribute](#how-to-contribute)
* [Technical RFCs](https://docs.synnaxlabs.com/category/technical-rfcs)

# What is Synnax?

Synnax is a distributed telemetry engine designed to acquire and store data
from, issue commands to, and process telemetry generated by hardware systems. It
scales horizontally, and can be deployed on edge devices (data acquisiton) in
highly dynamic environments with intermittent network connectivity, or in cloud
environments (data processing) for high performance analyis.

# Development Status

Synnax is currently in alpha (v0.1.0) and is under active development. The API
is unstable and may change at any time. Synnax
follows [semantic versioning](https://semver.org/)
guidelines.

# How to Contribute

We welcome contributions. Reach out to [Emiliano](mailto:emilbon99@gmail.com)
(emilbon99@gmail.com) if you'd like to get involved. While you wait for a
response, check out
the [New Developer Guide](https://docs.synnaxlabs.com/category/developers)
to get up to speed. Also, feel free to browse through the
[technical RFCs](https://docs.synnaxlabs.com/category/technical-rfcs) to get a
sense of where we've been and where we're going.

# Repository Organization

Synnax is built as a collection of several projects, all of which are collected
in this monorepo. The following is a list of the services and their purpose:

* [Aspen](https://github.com/synnaxlabs/synnax/tree/main/aspen) - A gossip based
  distributed key-value store used for propagating and persisting metadata
  between nodes, such cluster topology, state, and configuration. The core RFC
  for Aspen is
  available [here](https://docs.synnaxlabs.com/rfc/2-220518-aspen-distributed-storage)
  .
* [Cesium](https://github.com/synnaxlabs/synnax/tree/main/cesium) - An embedded
  time-series engine optimized for high performance reads and writes of regular
  telemetry. The core RFC for Cesium is
  available [here](https://docs.synnaxlabs.com/rfc/1-220517-cesium-segment-storage)
  .
* [Client](https://github.com/synnaxlabs/synnax/tree/main/client) - Client
  libraries for synnax available in multiple languages. The implementation for
  each language is a subpackage of the client package.
* [Documentation](https://github.com/synnaxlabs/synnax/tree/main/docs) - The
  technical and user-facing documentation for Synnax. Contains the code for the
  Synnax documentation website, technical RFCs, and additonal media such as
  logos.
* [Freighter](https://github.com/synnaxlabs/synnax/tree/main/freighter) - A
  protocol agnostic network transport for cross-language unary and streaming
  communication. Freighter has implementations in several languages; each
  implementation is contained in a sub-directory of the freighter service. The
  core RFC for Freighter is
  available [here](https://docs.synnaxlabs.com/rfc/6-220809-freighter).
* [Pluto](https://github.com/synnaxlabs/synnax/tree/main/pluto) - A React
  component library for building the Synnax user interfaces. This package
  includes theming standards (primary colors, grays, errors, fonts, etc.).
* [Synnax](https://github.com/synnaxlabs/synnax/tree/main/synnax) - The core
  Synnax server, which integrates all other services to provide a complete
  telemetry system.
  * [X](https://github.com/synnaxlabs/synnax/tree/main/x) - The common utilities
  used across all Synnax services. To list a few interesting examples:
    * [Alamos](https://github.com/synnaxlabs/synnax/tree/main/x/alamos) -
      Dependency injected code instrumentation.
    * [Confluence](https://github.com/synnaxlabs/synnax/tree/main/x/confluence)
      - Assemble and run concurrent data processing and message passing
      pipelines.
    * [Gorp](https://github.com/synnaxlabs/synnax/tree/main/x/gorp) - Efficient
      querying of go-types to and from a key-value store.
    * [Signal](https://github.com/synnaxlabs/synnax/tree/main/x/signal) - A
      library for controlling the lifecycle of communicating sequential
      processes.
  
  

